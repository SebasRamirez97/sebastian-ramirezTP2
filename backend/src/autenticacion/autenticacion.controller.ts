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
  Req 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AutenticacionService } from './autenticacion.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response, Request } from 'express';
// Ajusta la ruta del AuthGuard según dónde lo tengas ubicado en tu proyecto:
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'; 

@Controller('autenticacion') // O 'auth' según prefieras
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Post('registro')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(), // Almacena temporalmente en memoria para pasarlo a Cloudinary
    }),
  )
  async registrar(
    @Body() registroDto: RegistroDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 1. Ejecutamos el registro en el servicio (con o sin archivo adjunto)
    const token = await this.autenticacionService.registrar(registroDto, file);

    // 2. Seteamos la cookie HttpOnly con el token JWT devuelto
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
    // 1. Validamos credenciales y generamos el token
    const token = await this.autenticacionService.login(loginDto);

    // 2. Seteamos la cookie HttpOnly en la respuesta del navegador
    this.autenticacionService.setTokenCookie(res, token);

    return { 
      message: 'Inicio de sesión exitoso', 
      token 
    };
  }

  // Ruta protegida de ejemplo usando el JwtAuthGuard basado en Cookies
  @Get('perfil/:id')
  @UseGuards(JwtAuthGuard)
  async obtenerPerfil(@Param('id') id: string) {
    return await this.autenticacionService.getPerfil(id);
  }

  // Ruta opcional para verificar el usuario autenticado actual a través de la cookie
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async obtenerUsuarioActual(@Req() req: Request) {
    // El AuthGuard inyecta el payload descodificado en req.user
    const userId = (req as any).user?.sub;
    return await this.autenticacionService.getPerfil(userId);
  }
}