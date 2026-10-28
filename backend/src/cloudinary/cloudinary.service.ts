// backend/src/cloudinary/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    // Inicializamos Cloudinary con las variables de entorno
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      // Creamos un stream de lectura a partir del buffer que guardó Multer en memoria
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'recetas-red-social' }, // (Opcional) Carpeta en tu Cloudinary donde se guardarán
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );

      // Convertimos el buffer en un stream y lo enviamos a Cloudinary
      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }
}