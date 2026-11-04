// backend/src/publicaciones/publicaciones.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Header,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard.js';

@Controller('publicaciones')
@UseGuards(JwtAuthGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  async crear(
    @Body() crearPublicacionDto: CrearPublicacionDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const usuarioId = req.user.sub;
    return await this.publicacionesService.crear(
      crearPublicacionDto,
      file,
      usuarioId,
    );
  }

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async findAll(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @Query('orden') orden: string = 'fecha',
    @Query('usuarioId') usuarioId?: string,
  ) {
    return await this.publicacionesService.findAll(limit, offset, orden, usuarioId);
  }

  @Get('mis-publicaciones')
  async findMisPublicaciones(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @Query('orden') orden: string = 'fecha',
    @Req() req: any,
  ) {
    const usuarioId = req.user.sub;
    // 💡 Ahora reutilizamos los parámetros dinámicos que llegan de la URL
    return await this.publicacionesService.findAll(limit, offset, orden, usuarioId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.publicacionesService.findOne(id);
  }

  // Baja lógica de publicación (DELETE)
  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user.sub;
    const esAdmin = req.user.role === 'admin'; // Ajusta según tu estructura de roles en el token
    return await this.publicacionesService.bajaLogica(id, usuarioId, esAdmin);
  }

  // Dar Me Gusta (POST)
  @Post(':id/like')
  async darLike(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user.sub;
    return await this.publicacionesService.darLike(id, usuarioId);
  }

  // Quitar Me Gusta (DELETE)
  @Delete(':id/like')
  async quitarLike(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user.sub;
    return await this.publicacionesService.quitarLike(id, usuarioId);
  }
  @Post(':id/comentarios')
  async comentar(
    @Param('id') id: string,
    @Body('texto') texto: string,
    @Req() req: any,
  ) {
    const usuarioId = req.user.sub;
    return await this.publicacionesService.comentar(id, texto, usuarioId);
  }

  // 👇 GET: Traer comentarios de una publicación con paginación y ordenados (más recientes primero)
  @Get(':id/comentarios')
  async obtenerComentarios(
    @Param('id') id: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return await this.publicacionesService.obtenerComentarios(
      id, 
      Number(limit), 
      Number(offset)
    );
  }

  // 👇 PUT: Modificar un comentario existente y marcar modificado: true
  @Put('comentarios/:comentarioId')
  async editarComentario(
    @Param('comentarioId') comentarioId: string,
    @Body('texto') texto: string,
    @Req() req: any,
  ) {
    const usuarioId = req.user.sub; // ID del usuario autenticado que intenta editar
    return await this.publicacionesService.editarComentario(
      comentarioId, 
      texto, 
      usuarioId
    );
  }

  @Delete('comentarios/:comentarioId')
  async eliminarComentario(
    @Param('comentarioId') comentarioId: string,
    @Req() req: any,
  ) {
    const usuarioId = req.user.sub;
    return await this.publicacionesService.eliminarComentario(
      comentarioId, 
      usuarioId
    );
  }
}

  