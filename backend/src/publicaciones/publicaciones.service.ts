// backend/src/publicaciones/publicaciones.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Publicacion, PublicacionDocument } from './entities/publicacion.entity.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async crear(
    crearPublicacionDto: CrearPublicacionDto,
    file: Express.Multer.File,
    usuarioId: string,
  ): Promise<PublicacionDocument> {
    if (!isValidObjectId(usuarioId)) {
      throw new BadRequestException('ID de usuario no válido');
    }

    let imagenUrl = '';

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      imagenUrl = uploadResult.secure_url;
    }

    const nuevaPublicacion = new this.publicacionModel({
      ...crearPublicacionDto,
      imagenUrl,
      autor: usuarioId,
      activo: true, // Por defecto activa
      likes: [],     // Array vacío de likes al crear
    });

    return await nuevaPublicacion.save();
  }

  // Listar con paginación, filtros y ordenamiento (Sprint 2)
  async findAll(
    limit: number = 10,
    offset: number = 0,
    orden: string = 'fecha',
    usuarioId?: string,
  ): Promise<PublicacionDocument[]> {
    const filtro: any = { activo: true }; // Solo publicaciones activas (baja lógica)

    if (usuarioId) {
      if (!isValidObjectId(usuarioId)) {
        throw new BadRequestException('ID de usuario no válido para filtrar');
      }
      filtro.autor = new Types.ObjectId(usuarioId);
    }

    const publicaciones = await this.publicacionModel
      .find(filtro)
      .populate('autor', '-password')
      .skip(Number(offset))
      .limit(Number(limit))
      .exec();

    // Ordenamiento por fecha (por defecto) o por cantidad de likes
    if (orden === 'likes') {
      publicaciones.sort((a, b) => b.likes.length - a.likes.length);
    } else {
      // Orden por fecha descendiente (más reciente primero)
      publicaciones.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return publicaciones;
  }

  async findOne(id: string): Promise<PublicacionDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de publicación no válido');
    }

    const publicacion = await this.publicacionModel
      .findOne({ _id: id, activo: true })
      .populate('autor', '-password')
      .exec();

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return publicacion;
  }

  // Baja lógica (DELETE)
  async bajaLogica(id: string, usuarioId: string, esAdmin: boolean): Promise<{ message: string }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de publicación no válido');
    }

    const publicacion = await this.publicacionModel.findById(id);
    if (!publicacion || !publicacion.activo) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Verificar si es el autor o admin
    if (publicacion.autor.toString() !== usuarioId && !esAdmin) {
      throw new ForbiddenException('No tienes permisos para eliminar esta publicación');
    }

    publicacion.activo = false;
    await publicacion.save();

    return { message: 'Publicación eliminada correctamente' };
  }

  // Dar Me Gusta (POST)
  async darLike(id: string, usuarioId: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de publicación no válido');
    }

    const publicacion = await this.publicacionModel.findOne({ _id: id, activo: true });
    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const userObjectId = new Types.ObjectId(usuarioId);
    const yaDioLike = publicacion.likes.some((likeId) => likeId.toString() === usuarioId);

    if (!yaDioLike) {
      publicacion.likes.push(userObjectId);
      await publicacion.save();
    }

    return { message: 'Me gusta registrado', totalLikes: publicacion.likes.length };
  }

  // Quitar Me Gusta (DELETE)
  async quitarLike(id: string, usuarioId: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de publicación no válido');
    }

    const publicacion = await this.publicacionModel.findOne({ _id: id, activo: true });
    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    publicacion.likes = publicacion.likes.filter((likeId) => likeId.toString() !== usuarioId);
    await publicacion.save();

    return { message: 'Me gusta removido', totalLikes: publicacion.likes.length };
  }
}