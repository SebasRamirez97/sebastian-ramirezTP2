// backend/src/autenticacion/autenticacion.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  Res, 
  Get, 
  Param, 
  UseGuards, 
  Req,
  Query // 👈 1. Importar Query aquí
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AutenticacionService } from './autenticacion.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'; 

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Post('registro')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
    }),
  )
  async registrar(
    @Body() registroDto: RegistroDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.autenticacionService.registrar(registroDto, file);
    this.autenticacionService.setTokenCookie(res, token);
    return { 
      message: 'Usuario registrado exitosamente', 
      token 
    };
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.autenticacionService.login(loginDto);
    this.autenticacionService.setTokenCookie(res, token);
    return { 
      message: 'Inicio de sesión exitoso', 
      token 
    };
  }

  // 👇 2. Endpoint de verificación limpio que delega al servicio
  @Get('verificar')
  async verificarDisponibilidad(
    @Query('correo') correo?: string, 
    @Query('usuario') usuario?: string
  ) {
    return await this.autenticacionService.verificarDisponibilidad(correo, usuario);
  }

  @Get('perfil/:id')
  @UseGuards(JwtAuthGuard)
  async obtenerPerfil(@Param('id') id: string) {
    return await this.autenticacionService.getPerfil(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async obtenerUsuarioActual(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return await this.autenticacionService.getPerfil(userId);
  }

  // backend/src/autenticacion/autenticacion.controller.ts

  // 👇 Ruta autorizar por POST: Valida token y devuelve datos del usuario (o 401 automático si falla)
  @Post('autorizar')
  @UseGuards(JwtAuthGuard)
  async autorizarToken(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return await this.autenticacionService.getPerfil(userId);
  }

  // 👇 Ruta refrescar por POST: Valida el token actual y emite uno nuevo con 15 min de vigencia
  @Post('refrescar')
  @UseGuards(JwtAuthGuard)
  async refrescarToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const usuarioPayload = (req as any).user;
    const nuevoToken = await this.autenticacionService.generateToken(usuarioPayload);
    
    // Seteamos la nueva cookie con el token renovado
    this.autenticacionService.setTokenCookie(res, nuevoToken);
    
    return { 
      message: 'Token refrescado exitosamente',
      token: nuevoToken 
    };
  }
}