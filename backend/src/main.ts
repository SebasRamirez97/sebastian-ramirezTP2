// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; 
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as dns from 'dns';
import cookieParser from 'cookie-parser';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:4200', 'https://tu-frontend.vercel.app'],
    credentials: true,
  });

  app.use(cookieParser());

  // ¡Adiós a useStaticAssets! Ya no necesitamos la carpeta local 'uploads' gracias a Cloudinary.

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
