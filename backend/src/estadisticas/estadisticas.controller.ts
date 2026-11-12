// backend/src/estadisticas/estadisticas.controller.ts
import { Controller, Get, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard.js';
import { EstadisticasService } from './estadisticas.service.js';

@Controller('estadisticas')
@UseGuards(JwtAuthGuard)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  // 1. Cantidad de publicaciones por usuario en un lapso de tiempo
  @Get('publicaciones-por-usuario')
  async getPublicacionesPorUsuario(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Req() req: any,
  ) {
    this.validarEsAdmin(req);
    return await this.estadisticasService.publicacionesPorUsuario(inicio, fin);
  }

  // 2. Cantidad de comentarios realizados en un lapso de tiempo
  @Get('comentarios-tiempo')
  async getComentariosEnTiempo(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Req() req: any,
  ) {
    this.validarEsAdmin(req);
    return await this.estadisticasService.comentariosEnTiempo(inicio, fin);
  }

  // 3. Cantidad de comentarios en cada publicación en un lapso de tiempo
  @Get('comentarios-por-publicacion')
  async getComentariosPorPublicacion(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Req() req: any,
  ) {
    this.validarEsAdmin(req);
    return await this.estadisticasService.comentariosPorPublicacion(inicio, fin);
  }

  // 🛡️ Helper privado para asegurar que solo los administradores accedan
  private validarEsAdmin(req: any) {
    const perfil = req.user.perfil || req.user.role;
    if (perfil !== 'administrador' && perfil !== 'admin') {
      throw new ForbiddenException('Acceso denegado. Las estadísticas solo están disponibles para administradores.');
    }
  }
}