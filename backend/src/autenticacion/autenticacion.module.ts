// backend/src/autenticacion/autenticacion.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AutenticacionController } from './autenticacion.controller.js';
import { AutenticacionService } from './autenticacion.service.js';
import { Usuario, UsuarioSchema } from '../usuarios/entities/usuario.entity.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema }
    ]),
    // Configuramos JWT con una clave secreta y un tiempo de expiración de sesión (ej. 1 hora o 1 día)
    JwtModule.register({
      global: true, // Hace que el servicio JWT esté disponible en toda la aplicación si se requiere
      secret: process.env.JWT_SECRET || 'clave-secreta-super-segura-recetas',
      signOptions: { expiresIn: '1m' }, // Tiempo de sesión abierta (ej: 2 horas)
    }),
  CloudinaryModule],
  controllers: [AutenticacionController],
  providers: [AutenticacionService],
})
export class AutenticacionModule {}