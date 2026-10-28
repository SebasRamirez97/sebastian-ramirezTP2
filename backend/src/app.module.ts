import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AutenticacionModule } from './autenticacion/autenticacion.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    AutenticacionModule,
    UsuariosModule,
    PublicacionesModule,
    CloudinaryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
