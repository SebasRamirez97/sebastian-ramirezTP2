// backend/src/cloudinary/cloudinary.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service.js';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService], // <--- Muy importante para que otros módulos (como AutenticacionModule) puedan usarlo
})
export class CloudinaryModule {}