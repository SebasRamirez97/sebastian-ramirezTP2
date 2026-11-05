import { Controller, Get, Res } from '@nestjs/common';
import type{ Response } from 'express';

@Controller('favicon.ico')
export class FaviconController {
  @Get()
  getFavicon(@Res() res: Response) {
    res.status(204).send(); // Responde que no hay contenido y evita el error 500
  }
}