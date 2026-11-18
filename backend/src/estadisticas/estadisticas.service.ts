// backend/src/estadisticas/estadisticas.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  // backend/src/estadisticas/estadisticas.service.ts
  // backend/src/estadisticas/estadisticas.service.ts
  // 🛠️ Helper privado blindado para parsear fechas locales exactas sin desfase UTC
  private obtenerRangoFechas(lapso?: string, inicioPersonalizado?: string, finPersonalizado?: string) {
    if (inicioPersonalizado && finPersonalizado) {
      // inicioPersonalizado llega como 'YYYY-MM-DD' (ej: '2026-11-18')
      const [anioInicio, mesInicio, diaInicio] = inicioPersonalizado.split('-').map(Number);
      const [anioFin, mesFin, diaFin] = finPersonalizado.split('-').map(Number);

      // Creamos la fecha usando componentes locales puros (meses en JS van de 0 a 11)
      const fechaInicio = new Date(anioInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0);
      const fechaFin = new Date(anioFin, mesFin - 1, diaFin, 23, 59, 59, 999);

      if (fechaInicio > fechaFin) {
        throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin.');
      }

      return { fechaInicio, fechaFin };
    }

    if (lapso === 'todo' || !lapso) {
      return null;
    }

    const hoyLocal = new Date();
    const anio = hoyLocal.getFullYear();
    const mes = hoyLocal.getMonth();
    const dia = hoyLocal.getDate();

    const fechaInicio = new Date(anio, mes, dia, 0, 0, 0, 0);
    const fechaFin = new Date(anio, mes, dia, 23, 59, 59, 999);

    if (lapso === '7d') {
      fechaInicio.setDate(fechaInicio.getDate() - 7);
    } else if (lapso === '30d') {
      fechaInicio.setDate(fechaInicio.getDate() - 30);
    }

    return { fechaInicio, fechaFin };
  }

  async publicacionesPorUsuario(lapso?: string, fechaInicio?: string, fechaFin?: string) {
    const rango = this.obtenerRangoFechas(lapso, fechaInicio, fechaFin);
    
    const matchStage: any = {};
    if (rango) {
      matchStage.createdAt = { $gte: rango.fechaInicio, $lte: rango.fechaFin };
    }

    const resultado = await this.publicacionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: [{ $type: '$autor' }, 'string'] },
              then: { $toObjectId: '$autor' },
              else: '$autor',
            },
          },
          totalPublicaciones: { $sum: 1 }, }, }, {$lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuarioInfo',
        },
      },
      {
        $unwind: {
          path: '$usuarioInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          usuario: { 
            $ifNull: ['$usuarioInfo.usuario', { $ifNull: ['$usuarioInfo.correo', 'Anónimo'] }] 
          },
          totalPublicaciones: 1,
        },
      },
      { $sort: { totalPublicaciones: -1 } },
    ]);

    return {
      labels: resultado.map((item: any) => `@${item.usuario}`),
      valores: resultado.map((item: any) => item.totalPublicaciones),
    };
  }

  async comentariosEnTiempo(lapso?: string, fechaInicio?: string, fechaFin?: string) {
    const rango = this.obtenerRangoFechas(lapso, fechaInicio, fechaFin);
    const matchDateStage: any = {};

    if (rango) {
      matchDateStage['comentarios.fecha'] = { $gte: rango.fechaInicio, $lte: rango.fechaFin };
    }

    const resultado = await this.publicacionModel.aggregate([
      { $unwind: '$comentarios' },
      { $match: matchDateStage },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$comentarios.fecha',
              timezone: '-03:00' 
            },
          },
          totalComentarios: { $sum: 1 }, }, }, {$sort: { _id: 1 } },
    ]);

    return {
      labels: resultado.map((item: any) => item._id),
      valores: resultado.map((item: any) => item.totalComentarios),
    };
  }

  async comentariosPorPublicacion(lapso?: string, fechaInicio?: string, fechaFin?: string) {
    const rango = this.obtenerRangoFechas(lapso, fechaInicio, fechaFin);
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
      { $sort: { totalComentarios: -1 } }, {$limit: 10 },
    ]);

    return {
      labels: resultado.map((item: any) => item.titulo || 'Sin título'),
      valores: resultado.map((item: any) => item.totalComentarios),
    };
  }
}