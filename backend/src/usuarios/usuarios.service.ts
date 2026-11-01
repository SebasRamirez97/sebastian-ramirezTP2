// backend/src/usuarios/usuarios.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  // Listar todos los usuarios de la red social (sin mostrar contraseñas)
  async findAll() {
    const usuarios = await this.usuarioModel.find().select('-password').exec();
    return usuarios;
  }

  // Buscar un usuario específico por su ID
  async findOne(id: string) {
    const usuario = await this.usuarioModel.findById(id).select('-password').exec();
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  // 👇 NUEVO MÉTODO PARA SUBIR A CLOUDINARY Y ACTUALIZAR EL AVATAR
  async actualizarAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ninguna imagen.');
    }

    // Función auxiliar para subir el buffer a Cloudinary mediante una Promesa
    const uploadToCloudinary = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'avatares_usuarios' }, // Carpeta opcional en tu Cloudinary
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
        uploadStream.end(file.buffer);
      });
    };

    // 1. Subimos la imagen a Cloudinary
    const cloudinaryResponse = await uploadToCloudinary();

    // 2. Actualizamos la propiedad avatarUrl del usuario en MongoDB
    const usuarioActualizado = await this.usuarioModel
      .findByIdAndUpdate(
        userId,
        { avatarUrl: cloudinaryResponse.secure_url },
        { new: true }, // Retorna el documento actualizado
      )
      .select('-password')
      .exec();

    if (!usuarioActualizado) {
      throw new NotFoundException('Usuario no encontrado para actualizar el avatar');
    }

    return usuarioActualizado;
  }
}