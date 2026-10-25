// backend/src/autenticacion/autenticacion.controller.ts
import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AutenticacionService } from './autenticacion.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Post('registro')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads', // Carpeta donde se guardarán las imágenes físicas
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`); // Nombre único con su extensión original
        },
      }),
    }),
  )
  async registrar(
    @Body() registroDto: RegistroDto,
    @UploadedFile() file?: Express.Multer.File, // Captura el archivo enviado desde Angular
  ) {
    // Si se subió un archivo, construimos su ruta relativa o URL para la base de datos
    const avatarUrl = file ? `/uploads/${file.filename}` : '';
    return await this.autenticacionService.registrar(registroDto, avatarUrl);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.autenticacionService.login(loginDto);
  }
}