// backend/src/usuarios/usuarios.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';

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
}