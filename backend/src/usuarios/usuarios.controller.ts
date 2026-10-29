// backend/src/usuarios/usuarios.controller.ts
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // 1. PRIMERO la ruta estática 'perfil' de forma asíncrona
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async obtenerPerfil(@Req() req: any) {
    const userId = req.user.userId || req.user.sub; // Aseguramos capturar el ID sin importar cómo se guarde en el payload
    return await this.usuariosService.findOne(userId);
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