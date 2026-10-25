// backend/src/publicaciones/publicaciones.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard.js';

@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @UseGuards(JwtAuthGuard) // Ruta protegida: requiere token para crear recetas
  @Post()
  async crear(@Body() crearPublicacionDto: CrearPublicacionDto, @Req() req: any) {
    // req.user viene del JwtAuthGuard con la info decodificada del token (sub es el ID del usuario)
    const usuarioId = req.user.sub;
    return await this.publicacionesService.crear(crearPublicacionDto, usuarioId);
  }

  @Get()
  async findAll() {
    return await this.publicacionesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.publicacionesService.findOne(id);
  }
}