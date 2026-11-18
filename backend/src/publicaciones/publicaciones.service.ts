import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Publicacion, PublicacionDocument } from './entities/publicacion.entity.js';
import { Usuario, UsuarioDocument } from '../usuarios/entities/usuario.entity.js'; // 👈 Asegúrate de importar tu entidad/modelo de usuario
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Usuario.name) // 👈 Inyectamos el modelo de Usuario
    private readonly usuarioModel: Model<UsuarioDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  // 🛡️ Validador auxiliar interno para verificar estado y rol de usuario
  private async validarUsuarioActivoYPermisos(usuarioId: string) {
    const usuario = await this.usuarioModel.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (usuario.activo === false) {
      throw new ForbiddenException('CUENTA_INHABILITADA: Tu cuenta ha sido deshabilitada. No puedes realizar esta acción.');
    }
    return usuario;
  }
  
  async crear(
    crearPublicacionDto: CrearPublicacionDto,
    file: Express.Multer.File,
    usuarioId: string,
  ): Promise<PublicacionDocument> {
    await this.validarUsuarioActivoYPermisos(usuarioId);

    let imagenUrl = '';

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      imagenUrl = uploadResult.secure_url;
    }

    const nuevaPublicacion = new this.publicacionModel({
      ...crearPublicacionDto,
      imagenUrl,
      autor: usuarioId,
      activo: true,
      likes: [],
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
      .populate('autor', '-password') // Popula el autor principal de la receta
      .populate({
        path: 'comentarios.autor', // 👈 Popula el autor dentro de cada comentario
        select: '-password',        // Excluye la contraseña del usuario que comentó
      })
      .exec();

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return publicacion;
  }


 // Baja lógica (DELETE)
  async bajaLogica(id: string, usuarioId: string, perfilUsuario: string): Promise<{ message: string }> {
    // 🛡️ 1. Validar si el usuario está inhabilitado primero
    await this.validarUsuarioActivoYPermisos(usuarioId);

    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de publicación no válido');
    }

    const publicacion = await this.publicacionModel.findById(id);
    if (!publicacion || !publicacion.activo) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const esDueno = publicacion.autor.toString() === usuarioId;
    const esAdmin = perfilUsuario === 'administrador' || perfilUsuario === 'admin';

    // 🛡️ 2. Validar si un perfil usuario intenta eliminar algo que no es suyo
    if (!esDueno && !esAdmin) {
      throw new ForbiddenException('ROL_INSUFICIENTE_PUBLICACION: Una cuenta con perfil de usuario no puede eliminar publicaciones que no le pertenecen.');
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
    await this.validarUsuarioActivoYPermisos(usuarioId);
    
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

  // 📝 1. GET: Obtener comentarios con paginación y orden descendente (más recientes primero)
  // backend/src/publicaciones/publicaciones.service.ts

async obtenerComentarios(publicacionId: string, limit: number = 3, offset: number = 0) {
  // 1. Buscamos la publicación y populamos los datos del autor de cada comentario
  const publicacion = await this.publicacionModel.findById(publicacionId)
    .populate({
      path: 'comentarios.autor',
      select: '-password',
    });

  if (!publicacion) {
    throw new NotFoundException('Publicación no encontrada');
  }

  // 2. Ordenar los comentarios del más reciente al más antiguo (fecha descendente)
  const comentariosOrdenados = publicacion.comentarios.sort(
    (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const total = comentariosOrdenados.length;

  // 3. Aplicar paginación (slice corta desde el offset la cantidad definida en limit)
  const comentariosPaginados = comentariosOrdenados.slice(offset, offset + limit);

  return {
    total,
    comentarios: comentariosPaginados,
    hasMore: offset + limit < total, // 👈 Útil para que el frontend sepa si oculta o muestra el botón "Cargar más"
  };
}
  // ✏️ 2. PUT: Modificar un comentario y marcarlo como modificado: true
  async editarComentario(comentarioId: string, nuevoTexto: string, usuarioId: string) {
  await this.validarUsuarioActivoYPermisos(usuarioId);
  const publicacion = await this.publicacionModel.findOne({ 'comentarios._id': comentarioId });
  if (!publicacion) {
    throw new NotFoundException('Comentario o publicación no encontrados');
  }

  const comentario: any = publicacion.comentarios.id(comentarioId);
  if (!comentario) {
    throw new NotFoundException('Comentario no encontrado');
  }

  if (comentario.autor.toString() !== usuarioId) {
    throw new ForbiddenException('No tienes permiso para editar este comentario');
  }

  comentario.texto = nuevoTexto;
  comentario.modificado = true; 

  await publicacion.save();

  return {
    message: 'Comentario actualizado exitosamente',
    comentario,
  };
}

  async eliminarComentario(comentarioId: string, usuarioId: string) {
    const usuario = await this.validarUsuarioActivoYPermisos(usuarioId);
    const publicacion = await this.publicacionModel.findOne({ 'comentarios._id': comentarioId });
    if (!publicacion) {
      throw new NotFoundException('Comentario o publicación no encontrados');
    }

    const comentario: any = publicacion.comentarios.id(comentarioId);
    if (!comentario) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const esDuenoComentario = comentario.autor.toString() === usuarioId;
    const esAdmin = usuario.perfil === 'administrador' || usuario.perfil === 'admin'; // 👈 Obtenemos el rol directamente de la BD del usuario

    // 🛡️ REGLA ESTRICTA: Solo el autor del comentario o un administrador pueden eliminarlo
    if (!esDuenoComentario && !esAdmin) {
      throw new ForbiddenException('ROL_INSUFICIENTE_COMENTARIO: Una cuenta con perfil de usuario solo puede eliminar sus propios comentarios.');
    }

    // Eliminamos el comentario del DocumentArray usando el método pull de Mongoose
    publicacion.comentarios.pull(comentarioId);
    await publicacion.save();

    return {
      message: 'Comentario eliminado exitosamente',
    };
  }
}
