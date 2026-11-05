import { Controller, Get } from '@nestjs/common';

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
}