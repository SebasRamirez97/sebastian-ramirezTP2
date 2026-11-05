// src/root.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getHello() {
    return {
      status: 'success',
      message: 'API de Red Social de Recetas funcionando correctamente en Vercel 🚀',
      version: '1.0.0',
    };
  }

  @Get('favicon.ico')
  getFavicon() {
    return;
  }
}