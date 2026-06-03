import { Controller, Get } from '@nestjs/common';
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
      service: 'settlement-service',
      timestamp: new Date().toISOString(),
    };
  }
}
