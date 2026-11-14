// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; 
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as dns from 'dns';
import cookieParser from 'cookie-parser';
import { configure } from '@codegenie/serverless-express'; // O usa '@vendia/serverless-express' según tu package.json
import { Express } from 'express';

dns.setServers(['8.8.8.8', '1.1.1.1']);

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
    
    // 👇 Usamos configure correctamente sin errores de TypeScript
    cachedServer = configure({ app: expressApp });
  }
  return cachedServer;
}

// 👈 Handler compatible con Vercel
export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  return server(req, res);
}

// Arranque local tradicional (sólo para desarrollo en tu PC)
if (process.env.NODE_ENV !== 'production') {
  NestFactory.create<NestExpressApplication>(AppModule).then(async (app) => {
    app.enableCors(corsOptions);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.use(cookieParser());
    await app.listen(process.env.PORT ?? 3000);
  });
}