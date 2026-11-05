import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getHello() {
    return { status: 'online', message: 'API Recipe Social Network funcionando correctamente 🚀' };
  }
}