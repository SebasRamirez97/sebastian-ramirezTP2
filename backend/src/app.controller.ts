import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class RootController {
  @Get()
  getHome() {
    return {
      status: 'online',
      message: 'API Recipe Social Network funcionando correctamente 🚀',
      version: '12.0.1'
    };
  }

  @Get('favicon.ico')
  getFavicon(@Res() res: Response) {
    res.status(204).send(); // Evita el error 500 devolviendo un "No Content"
  }
}