// backend/src/usuarios/usuarios.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';
import { v2 as cloudinary } from 'cloudinary';
import * as bcrypt from 'bcrypt'; // 👈 Asegúrate de importar bcrypt para encriptar la contraseña

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  // Listar todos los usuarios de la red social (sin mostrar contraseñas)
  async findAll() {
    const usuarios = await this.usuarioModel.find().select('-password').exec();
    return usuarios;
  }

  // Buscar un usuario específico por su ID
  async findOne(id: string) {
    const usuario = await this.usuarioModel
      .findById(id)
      .select('-password')
      .exec();
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  // 👇 NUEVO MÉTODO: Crear usuario desde el panel de administrador
  async crearPorAdmin(createUserDto: any) {
    // 1. Validar si el correo o nombre de usuario ya existen
    const existe = await this.usuarioModel.findOne({
      $or: [
        { correo: createUserDto.correo },
        { usuario: createUserDto.usuario },
      ],
    });

    if (existe) {
      throw new BadRequestException(
        'El correo o el nombre de usuario ya están registrados.',
      );
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 3. Crear y guardar el nuevo usuario
    const nuevoUsuario = new this.usuarioModel({
      ...createUserDto,
      password: hashedPassword,
      activo: true, // Nacen activos por defecto
    });

    const guardado = await nuevoUsuario.save();

    // 4. Retornar el objeto sin la contraseña
    const { password, ...usuarioObj } = guardado.toObject();
    return usuarioObj;
  }

  // 👇 NUEVO MÉTODO: Baja o alta lógica (cambiar el estado activo a true/false)
  async cambiarEstado(id: string, activo: boolean) {
    const usuarioActualizado = await this.usuarioModel
      .findByIdAndUpdate(
        id,
        { activo },
        { new: true }, // Retorna el documento ya modificado
      )
      .select('-password')
      .exec();

    if (!usuarioActualizado) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      mensaje: activo
        ? 'Usuario rehabilitado correctamente'
        : 'Usuario deshabilitado correctamente',
      usuario: usuarioActualizado,
    };
  }

  // Método existente para actualizar el avatar en Cloudinary
  async actualizarAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ninguna imagen.');
    }

    const uploadToCloudinary = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'avatares_usuarios' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
        uploadStream.end(file.buffer);
      });
    };

    const cloudinaryResponse = await uploadToCloudinary();

    const usuarioActualizado = await this.usuarioModel
      .findByIdAndUpdate(
        userId,
        { avatarUrl: cloudinaryResponse.secure_url },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!usuarioActualizado) {
      throw new NotFoundException(
        'Usuario no encontrado para actualizar el avatar',
      );
    }

    return usuarioActualizado;
  }

  async actualizarPerfil(id: string, perfil: string) {
    const usuarioActualizado = await this.usuarioModel
      .findByIdAndUpdate(
        id,
        { perfil },
        { new: true }, // Para que devuelva el documento actualizado
      )
      .exec();

    if (!usuarioActualizado) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuarioActualizado;
  }
}
