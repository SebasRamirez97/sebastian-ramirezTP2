// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; 
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as dns from 'dns';
import cookieParser from 'cookie-parser';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  // 1. Creamos la app sin activar el cors genérico aquí
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 2. Configuramos el CORS una sola vez y de forma correcta
  app.enableCors({
    origin: ['http://localhost:4200'],
    credentials: true, 
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();