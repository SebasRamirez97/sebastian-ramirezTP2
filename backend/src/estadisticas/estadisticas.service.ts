// backend/src/estadisticas/estadisticas.service.ts
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

  // 🛠️ Helper privado para convertir el lapso en un rango de fechas (o un filtro vacío si es 'todo')
  private obtenerRangoFechas(lapso: string) {
    if (lapso === 'todo') {
      return null; // Sin filtro de fecha para el histórico
    }

    const fechaFin = new Date();
    const fechaInicio = new Date();

    if (lapso === '7d') {
      fechaInicio.setDate(fechaFin.getDate() - 7);
    } else if (lapso === '30d') {
      fechaInicio.setDate(fechaFin.getDate() - 30);
    } else {
      fechaInicio.setDate(fechaFin.getDate() - 30); // Por defecto 30 días
    }

    return { fechaInicio, fechaFin };
  }

  async publicacionesPorUsuario(lapso: string) {
    const rango = this.obtenerRangoFechas(lapso);
    const matchStage: any = {};

    if (rango) {
      matchStage.createdAt = { $gte: rango.fechaInicio, $lte: rango.fechaFin };
    }

    const resultado = await this.publicacionModel.aggregate([
      { $match: matchStage },
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
          usuario: '$usuarioInfo.usuario', // O '$usuarioInfo.correo'
          totalPublicaciones: 1,
        },
      },
    ]);

    // Transformar a { labels, valores } para Chart.js
    return {
      labels: resultado.map((item: any) => `@${item.usuario || 'usuario'}`),
      valores: resultado.map((item: any) => item.totalPublicaciones),
    };
  }

  async comentariosEnTiempo(lapso: string) {
    const rango = this.obtenerRangoFechas(lapso);
    const matchDateStage: any = {};

    if (rango) {
      matchDateStage['comentarios.createdAt'] = { $gte: rango.fechaInicio, $lte: rango.fechaFin };
    }

    const resultado = await this.publicacionModel.aggregate([
      { $unwind: '$comentarios' },
      { $match: matchDateStage },
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

    // Transformar a { labels, valores } para Chart.js
    return {
      labels: resultado.map((item: any) => item._id),
      valores: resultado.map((item: any) => item.totalComentarios),
    };
  }

  async comentariosPorPublicacion(lapso: string) {
    const rango = this.obtenerRangoFechas(lapso);
    const matchStage: any = {};

    if (rango) {
      matchStage.createdAt = { $gte: rango.fechaInicio, $lte: rango.fechaFin };
    }

    const resultado = await this.publicacionModel.aggregate([
      { $match: matchStage },
      {
        $project: {
          titulo: '$titulo', 
          totalComentarios: { $size: { $ifNull: ['$comentarios', []] } },
        },
      },
      { $sort: { totalComentarios: -1 } },
      { $limit: 10 }, // Limitamos a las 10 recetas con más comentarios para que la torta luzca ordenada
    ]);

    // Transformar a { labels, valores } para Chart.js
    return {
      labels: resultado.map((item: any) => item.titulo || 'Sin título'),
      valores: resultado.map((item: any) => item.totalComentarios),
    };
  }
}