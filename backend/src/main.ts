// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; 
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as dns from 'dns';
import cookieParser from 'cookie-parser';
import pkg from '@vendia/serverless-express';
import { Express } from 'express';

const { configure, EVENT_SOURCES } = pkg as any; // 👈 Importar EVENT_SOURCES

dns.setServers(['8.8.8.8', '1.1.1.1']);

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    app.enableCors({
      origin: ['http://localhost:4200', 'https://sebastian-ramirez-tp-2-nest.vercel.app'],
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
    
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance() as Express;
    
    // 👇 Forzar el eventSource como VERCEL o API_GATEWAY para que no falle al adivinarlo
    cachedServer = configure({ 
      app: expressApp, 
      eventSource: EVENT_SOURCES.VERCEL // o eventSource: 'VERCEL'
    });
  }
  return cachedServer;
}

const handler = async (req: any, res: any, context: any) => {
  const server = await bootstrap();
  return server(req, res, context);
};

export default handler;

// Arranque local tradicional
if (process.env.NODE_ENV !== 'production') {
  NestFactory.create<NestExpressApplication>(AppModule).then(async (app) => {
    app.enableCors({
      origin: ['http://localhost:4200', 'https://sebastian-ramirez-tp-2-nest.vercel.app'],
      credentials: true, 
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.use(cookieParser());
    await app.listen(process.env.PORT ?? 3000);
  });
}