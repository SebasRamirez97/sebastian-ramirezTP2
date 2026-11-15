// backend/src/estadisticas/estadisticas.controller.ts
import { Controller, Get, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard.js';
import { EstadisticasService } from './estadisticas.service.js';

@Controller('estadisticas')
@UseGuards(JwtAuthGuard)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  // 1. Cantidad de publicaciones por usuario según el lapso
  @Get('publicaciones-usuario')
  async getPublicacionesPorUsuario(
    @Query('lapso') lapso: string,
    @Req() req: any,
  ) {
    this.validarEsAdmin(req);
    return await this.estadisticasService.publicacionesPorUsuario(lapso);
  }

  // 2. Cantidad de comentarios realizados en el tiempo según el lapso
  @Get('comentarios-tiempo')
  async getComentariosEnTiempo(
    @Query('lapso') lapso: string,
    @Req() req: any,
  ) {
    this.validarEsAdmin(req);
    return await this.estadisticasService.comentariosEnTiempo(lapso);
  }

  // 3. Cantidad de comentarios en cada publicación según el lapso
  @Get('comentarios-publicacion')
  async getComentariosPorPublicacion(
    @Query('lapso') lapso: string,
    @Req() req: any,
  ) {
    this.validarEsAdmin(req);
    return await this.estadisticasService.comentariosPorPublicacion(lapso);
  }

  // 🛡️ Helper privado para asegurar que solo los administradores accedan
  private validarEsAdmin(req: any) {
    const perfil = req.user.perfil || req.user.role;
    if (perfil !== 'administrador' && perfil !== 'admin') {
      throw new ForbiddenException('Acceso denegado. Las estadísticas solo están disponibles para administradores.');
    }
  }
}