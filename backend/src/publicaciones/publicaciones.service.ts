// backend/src/publicaciones/publicaciones.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Publicacion, PublicacionDocument } from './entities/publicacion.entity.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
  ) {}

  async crear(crearPublicacionDto: CrearPublicacionDto, usuarioId: string): Promise<PublicacionDocument> {
    if (!isValidObjectId(usuarioId)) {
      throw new BadRequestException('ID de usuario no válido');
    }

    const nuevaPublicacion = new this.publicacionModel({
      ...crearPublicacionDto,
      autor: usuarioId,
    });

    return await nuevaPublicacion.save();
  }

  async findAll(): Promise<PublicacionDocument[]> {
    return await this.publicacionModel
      .find()
      .populate('autor', '-password') // Trae los datos del usuario autor ocultando su contraseña
      .exec();
  }

  async findOne(id: string): Promise<PublicacionDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de publicación no válido');
    }

    const publicacion = await this.publicacionModel
      .findById(id)
      .populate('autor', '-password')
      .exec();

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return publicacion;
  }
}