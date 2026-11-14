// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as dns from 'dns';
import cookieParser from 'cookie-parser';
import { Express } from 'express';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const whitelist = [
  'http://localhost:4200',
  'http://localhost:4250',
  'https://sebastian-ramirez-tp-2-nest.vercel.app',
  'https://sebastian-ramirez-tp-2-angular.vercel.app',
];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
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

let cachedExpressApp: Express;

async function bootstrap(): Promise<Express> {
  if (!cachedExpressApp) {
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
    cachedExpressApp = app.getHttpAdapter().getInstance() as Express;
  }
  return cachedExpressApp;
}

// Vercel invoca directamente handler(req, res) con objetos nativos de Node HTTP
export default async function handler(req: any, res: any) {
  const expressApp = await bootstrap();
  return expressApp(req, res);
}

// Arranque local tradicional (sólo para desarrollo en tu PC)
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then((expressApp) => {
    const port = process.env.PORT ?? 3000;
    expressApp.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  });
}