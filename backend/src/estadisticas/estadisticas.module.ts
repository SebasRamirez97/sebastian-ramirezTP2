// backend/src/estadisticas/estadisticas.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';
import { Publicacion, PublicacionSchema } from '../publicaciones/entities/publicacion.entity.js';
import { Usuario, UsuarioSchema } from '../usuarios/entities/usuario.entity.js';

@Module({
  imports: [
    // 👇 ESTO ES LO QUE FALTA: Registrar los modelos que usa el servicio
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}