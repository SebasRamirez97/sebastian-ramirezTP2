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
      comentarios: [],
    });

    return await nuevaPublicacion.save();
  }

  // Listar con paginación, filtros y ordenamiento
  async findAll(
    limit: number = 10,
    offset: number = 0,
    orden: string = 'fecha',
    usuarioId?: string,
  ): Promise<any[]> {
    const matchStage: any = { activo: true };

    if (usuarioId) {
      if (!isValidObjectId(usuarioId)) {
        throw new BadRequestException('ID de usuario no válido para filtrar');
      }
      matchStage.autor = usuarioId; // Tu autor guardado como string
    }

    // Definimos el criterio de ordenamiento secundario/primario
    let sortStage: any = { createdAt: -1 }; // Por defecto por fecha descendiente

    if (orden === 'likes') {
      // 💡 Ordenamos por la cantidad numérica calculada (totalLikes) de mayor a menor,
      // y si hay empates (ej. 0 likes), desempata por fecha más reciente.
      sortStage = { totalLikes: -1, createdAt: -1 };
    }

    const pipeline: any[] = [
      { $match: matchStage },
      // 1. Creamos un campo temporal 'totalLikes' con el tamaño real del array
      {
        $addFields: {
          totalLikes: { $size: { $ifNull: ['$likes', []] } },
        },
      },
      // 2. Ordenamos usando el número exacto de likes
      { $sort: sortStage },
      // 3. Paginación exacta
      { $skip: Number(offset) },
      { $limit: Number(limit) },
    ];

    // Ejecutamos el aggregate
    const publicaciones = await this.publicacionModel.aggregate(pipeline).exec();

    // 4. Mantenemos tu populate original para que devuelva los datos del autor limpios (-password)
    return await this.publicacionModel.populate(publicaciones, {
      path: 'autor',
      select: '-password',
    });
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
  async comentar(id: string, texto: string, usuarioId: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de publicación no válido');
    }

    if (!texto || texto.trim() === '') {
      throw new BadRequestException('El texto del comentario no puede estar vacío');
    }

    const publicacion = await this.publicacionModel.findOne({ _id: id, activo: true });
    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Agregamos el nuevo comentario al array
    publicacion.comentarios.push({
      autor: new Types.ObjectId(usuarioId),
      texto: texto.trim(),
      fecha: new Date(),
    });

    await publicacion.save();

    // Devolvemos la publicación actualizada poblando el nombre y apellido del autor del comentario
    const pubActualizada = await this.publicacionModel
      .findById(id)
      .populate('autor', '-password')
      .populate('comentarios.autor', 'nombre apellido email') // 👈 Asegúrate de incluir 'apellido' aquí
      .exec();

    // Opcional por seguridad: ordenamos los comentarios en memoria del más nuevo al más viejo antes de enviarlos
    if (pubActualizada && pubActualizada.comentarios) {
      pubActualizada.comentarios.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    return pubActualizada;
  }

}