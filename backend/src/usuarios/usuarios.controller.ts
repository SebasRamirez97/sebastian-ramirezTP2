// backend/src/usuarios/usuarios.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Patch, 
  Param, 
  Body, 
  Req, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  ForbiddenException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard) // Protege todas las rutas por defecto exigiendo token JWT
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // ==========================================
  // 1. RUTAS DE PERFIL PROPIO (Usuario Autenticado)
  // ==========================================

  @Get('perfil')
  async obtenerPerfil(@Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    return await this.usuariosService.findOne(userId);
  }

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async actualizarAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.userId || req.user.sub;
    return await this.usuariosService.actualizarAvatar(userId, file);
  }

  // ==========================================
  // 2. RUTAS DE ADMINISTRACIÓN (Sprint 4)
  // ==========================================

  // GET: Listar todos los usuarios (Solo Administrador)
  @Get()
  async findAll(@Req() req: any) {
    this.validarEsAdmin(req);
    return await this.usuariosService.findAll();
  }

  // POST: Alta de un nuevo usuario por el admin (definiendo si es 'usuario' o 'administrador')
  @Post()
  async crearUsuario(@Body() createUserDto: any, @Req() req: any) {
    this.validarEsAdmin(req);
    return await this.usuariosService.crearPorAdmin(createUserDto);
  }

  // DELETE: Baja lógica (deshabilitar usuario para que no pueda ingresar)
  @Delete(':id')
  async deshabilitarUsuario(@Param('id') id: string, @Req() req: any) {
    this.validarEsAdmin(req);
    return await this.usuariosService.cambiarEstado(id, false);
  }

  // PATCH: Alta lógica (rehabilitar un usuario previamente deshabilitado)
  @Patch(':id/activar')
  async rehabilitarUsuario(@Param('id') id: string, @Req() req: any) {
    this.validarEsAdmin(req);
    return await this.usuariosService.cambiarEstado(id, true);
  }

  // ==========================================
  // 3. RUTA DINÁMICA POR ID (Al final para no pisar rutas fijas)
  // ==========================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usuariosService.findOne(id);
  }

  // Método auxiliar privado para validar que el token pertenezca a un administrador
  private validarEsAdmin(req: any) {
    const perfil = req.user.perfil || req.user.role;
    if (perfil !== 'administrador') {
      throw new ForbiddenException('Acceso denegado. Se requiere perfil de administrador.');
    }
  }

  @Patch(':id/perfil')
// @UseGuards(JwtAuthGuard, RolesGuard) // Descomenta o ajusta según los guards que uses para proteger rutas de admin
async cambiarPerfil(
  @Param('id') id: string,
  @Body('perfil') perfil: string,
) {
  return this.usuariosService.actualizarPerfil(id, perfil);
}
}