// backend/src/autenticacion/autenticacion.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Usuario,
  UsuarioDocument,
} from '../usuarios/entities/usuario.entity.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class AutenticacionService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async registrar(registroDto: RegistroDto, file?: Express.Multer.File) {
    // 1. Validar que las contraseñas coincidan
    if (registroDto.password !== registroDto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    // 2. Verificar si el correo o el nombre de usuario ya existen en la base de datos
    const existingUser = await this.usuarioModel.findOne({
      $or: [{ email: registroDto.correo }, { username: registroDto.usuario }],
    });

    if (existingUser) {
      throw new BadRequestException(
        'El correo o el nombre de usuario ya están registrados.',
      );
    }

    // 3. Subir la imagen a Cloudinary si se adjuntó un archivo
    let avatarUrl = '';
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      avatarUrl = uploadResult.secure_url;
    }

    // 4. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(registroDto.password, 10);

    // 5. Crear el usuario mapeando los campos del DTO a la estructura de la base de datos
    const newUser = await this.usuarioModel.create({
      nombre: registroDto.nombre,
      apellido: registroDto.apellido,
      correo: registroDto.correo, // Mapea 'correo' del DTO a 'email' del modelo
      usuario: registroDto.usuario, // Mapea 'usuario' del DTO a 'username' del modelo
      password: hashedPassword,
      fechaNacimiento: registroDto.fechaNacimiento,
      descripcionBreve: registroDto.descripcionBreve,
      avatarUrl: avatarUrl,
      perfil: 'usuario', // Por defecto 'usuario' según los requisitos
    });

    if (!newUser) {
      throw new BadRequestException('No se pudo registrar el usuario.');
    }

    // 6. Generar el token JWT
    return this.generateToken(newUser);
  }

  async login(loginDto: LoginDto) {
    // 1. Busca por correo o por nombre de usuario usando la propiedad 'identificador' del LoginDto
    const user = await this.usuarioModel.findOne({
      $or: [
        { correo: loginDto.identificador },
        { usuario: loginDto.identificador },
      ],
    });

    // 2. Validar si el usuario existe y si la contraseña es correcta
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 3. Generar el token JWT
    return this.generateToken(user);
  }

  async getPerfil(id: string) {
    const user = await this.usuarioModel.findById(id).select('-password');
    if (!user) {
      throw new UnauthorizedException('No se pudo obtener el perfil');
    }
    return user;
  }

  async generateToken(usuario: UsuarioDocument) {
    const payload = { 
      correo: usuario.correo, 
      usuario: usuario.usuario, 
      sub: usuario._id, 
      perfil: usuario.perfil 
    };
    return this.jwtService.signAsync(payload);
  }

  setTokenCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true, // Evita ataques XSS
      sameSite: 'strict', // Evita ataques CSRF
      secure: false, // Cambiar a true si usas HTTPS en producción
      maxAge: 1000 * 60 * 60 * 24, // 1 día de expiración
    });
  }
}
