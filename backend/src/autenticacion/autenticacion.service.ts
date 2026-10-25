import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordHasher } from '@nestjs/authentication';
import { JwtService } from '@nestjs/jwt';
import {
  Usuario,
  UsuarioDocument,
} from '../usuarios/entities/usuario.entity.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { PasswordHelper } from './helpers/password.helper.js';

@Injectable()
export class AutenticacionService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
    private readonly JwtService: JwtService, // Inyectamos JwtService
  ) {}

  async registrar(registroDto: RegistroDto, avatarUrl?: string) {
    // 1. Validar que las contraseñas coincidan
    if (registroDto.password !== registroDto.repetirPassword) {
      throw new ConflictException('Las contraseñas no coinciden');
    }

    // 2. Validar si el correo o usuario ya se encuentran registrados
    const usuarioExistente = await this.usuarioModel.findOne({
      $or: [{ correo: registroDto.correo }, { usuario: registroDto.usuario }],
    });

    if (usuarioExistente) {
      throw new ConflictException(
        'El correo electrónico o el nombre de usuario ya están registrados',
      );
    }

    // 3. Hashear la contraseña utilizando scrypt
   const hashedPassword = await PasswordHelper.hash(registroDto.password);

    // 4. Crear el nuevo usuario con perfil por defecto 'usuario'
    const nuevoUsuario = new this.usuarioModel({
      ...registroDto,
      password: hashedPassword,
      avatarUrl: avatarUrl || '',
      perfil: 'usuario',
    });

    const usuarioGuardado = await nuevoUsuario.save();
    // 5. Retornar el objeto sin la contraseña usando desestructuración
    const { password, ...usuarioObj } = usuarioGuardado.toObject();

    // Generamos el token JWT para que quede logueado automáticamente al registrarse
    const payload = {
      sub: usuarioObj._id,
      correo: usuarioObj.correo,
      perfil: usuarioObj.perfil,
    };
    const token = this.JwtService.sign(payload);

    return { access_token: token, usuario: usuarioObj };
  }

  async login(loginDto: LoginDto) {
    // 1. Buscar al usuario por correo o nombre de usuario
    const usuario = await this.usuarioModel.findOne({
      $or: [
        { correo: loginDto.identificador },
        { usuario: loginDto.identificador },
      ],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar la contraseña plana contra el hash almacenado
    const esPasswordValida = await PasswordHelper.verify(loginDto.password, usuario.password);

    if (!esPasswordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Retornar todos los datos del usuario sin la contraseña usando desestructuración
    const { password, ...usuarioObj } = usuario.toObject();


    // Creamos el payload con la información esencial del usuario que viajará cifrada en el token
    const payload = { sub: usuarioObj._id, correo: usuarioObj.correo, perfil: usuarioObj.perfil };
    const token = this.JwtService.sign(payload);

    // Retornamos el token junto a los datos del usuario para que Angular los almacene
    return {
      access_token: token,
      usuario: usuarioObj,
    };
  }
}
