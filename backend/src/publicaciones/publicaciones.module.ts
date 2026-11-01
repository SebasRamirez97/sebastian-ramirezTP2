// backend/src/publicaciones/publicaciones.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesService } from './publicaciones.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { Publicacion, PublicacionSchema } from './entities/publicacion.entity.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js'; // <--- 1. Importa el módulo

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
    ]),
    CloudinaryModule, // <--- 2. Agrégalo aquí en los imports
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
  exports: [PublicacionesService],
})
export class PublicacionesModule {}