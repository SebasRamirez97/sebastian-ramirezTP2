// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; 
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as dns from 'dns';
import cookieParser from 'cookie-parser';
import pkg from '@vendia/serverless-express';
import { Express } from 'express';

const { configure } = pkg as any;

dns.setServers(['8.8.8.8', '1.1.1.1']);

// 👇 Definimos la lista blanca y la configuración dinámica de CORS
const whitelist = [
  'http://localhost:4200', 
  'http://localhost:4250',
  'https://sebastian-ramirez-tp-2-nest.vercel.app',
  'https://sebastian-ramirez-tp-2-angular.vercel.app'
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por la política CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  credentials: true,
};

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // 👇 1. Aplicamos los corsOptions en Producción (Vercel)
    app.enableCors(corsOptions);
    
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
    
    cachedServer = configure({ app: expressApp });
  }
  return cachedServer;
}

const handler = async (req: any, res: any) => {
  const server = await bootstrap();
  return server(req, res);
};

export default handler;

// Arranque local tradicional (sólo para desarrollo en tu PC)
if (process.env.NODE_ENV !== 'production') {
  NestFactory.create<NestExpressApplication>(AppModule).then(async (app) => {
    // 👇 2. Aplicamos los corsOptions en Desarrollo Local
    app.enableCors(corsOptions);
    
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.use(cookieParser());
    await app.listen(process.env.PORT ?? 3000);
  });
}