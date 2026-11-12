import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion } from '../publicaciones/entities/publicacion.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>,
    @InjectModel(Usuario.name) private userModel: Model<Usuario>,
  ) {}

  async publicacionesPorUsuario(inicio: string, fin: string) {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    return await this.publicacionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: '$usuario',
          totalPublicaciones: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuarioInfo',
        },
      },
      { $unwind: '$usuarioInfo' },
      {
        $project: {
          email: '$usuarioInfo.email',
          totalPublicaciones: 1,
        },
      },
    ]);
  }

  async comentariosEnTiempo(inicio: string, fin: string) {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    // Si manejas los comentarios embebidos o en colección separada, 
    // puedes usar $unwind sobre el array de comentarios filtrando por fecha:
    return await this.publicacionModel.aggregate([
      { $unwind: '$comentarios' },
      {
        $match: {
          'comentarios.createdAt': { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$comentarios.createdAt' },
          },
          totalComentarios: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async comentariosPorPublicacion(inicio: string, fin: string) {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    return await this.publicacionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $project: {
          titulo: '$titulo', // O el campo identificador de la publicación
          totalComentarios: { $size: { $ifNull: ['$comentarios', []] } },
        },
      },
    ]);
  }
}