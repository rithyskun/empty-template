import { Controller, Get, Post } from '@nestjs/common';
import { Public } from '@erp/auth';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  @Public()
  health() {
    return {
      status: 'ok',
      service: 'identity-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('seed')
  @Public()
  async seedPost() {
    return this.appService.seed();
  }

  @Get('seed')
  @Public()
  async seedGet() {
    return this.appService.seed();
  }
}
