// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // Importante para manejar assets estáticos
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  // Cambiamos a NestExpressApplication para habilitar recursos estáticos
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Exponer la carpeta uploads públicamente a través de la ruta /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();