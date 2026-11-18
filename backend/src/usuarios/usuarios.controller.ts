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
  // GET: Listar todos los usuarios
  @Get()
  async findAll(@Req() req: any) {
    await this.validarEsAdmin(req); // 👈 Añadido await
    return await this.usuariosService.findAll();
  }

  // POST: Crear usuario
  @Post()
  async crearUsuario(@Body() createUserDto: any, @Req() req: any) {
    await this.validarEsAdmin(req); // 👈 Añadido await
    return await this.usuariosService.crearPorAdmin(createUserDto);
  }

  // DELETE: Deshabilitar usuario
  @Delete(':id')
  async deshabilitarUsuario(@Param('id') id: string, @Req() req: any) {
    await this.validarEsAdmin(req); // 👈 Añadido await
    return await this.usuariosService.cambiarEstado(id, false);
  }

  // PATCH: Rehabilitar usuario
  @Patch(':id/activar')
  async rehabilitarUsuario(@Param('id') id: string, @Req() req: any) {
    await this.validarEsAdmin(req); // 👈 Añadido await
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
  // backend/src/usuarios/usuarios.controller.ts
  // Modificamos el método auxiliar para que sea async y consulte la base de datos
  // 👇 Método auxiliar asíncrono correcto (Sin romper NestJS)
  private async validarEsAdmin(req: any) {
    const userId = req.user.userId || req.user.sub;
    const usuario = await this.usuariosService.findOne(userId);

    if (!usuario || usuario.activo === false || usuario.perfil !== 'administrador') {
      throw new ForbiddenException('Acceso denegado. Tu cuenta ha sido deshabilitada o ya no posees privilegios.');
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