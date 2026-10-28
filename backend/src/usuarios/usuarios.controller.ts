// backend/src/usuarios/usuarios.controller.ts
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

   // 1. PRIMERO la ruta estática 'perfil'
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@Req() req: any) {
    // Aquí extraes el ID del usuario desde el token de la cookie
    const userId = req.user.userId; // (o como guardes el payload en tu estrategia JWT)
    return this.usuariosService.findOne(userId);
  }

  @Get()
  async findAll() {
    return await this.usuariosService.findAll();
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usuariosService.findOne(id);
  }
}