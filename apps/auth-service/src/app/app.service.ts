import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SeedService } from '@erp/identity-core';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly seedService: SeedService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedService.seed();
    } catch (err) {
      this.logger.error('Bootstrap seed failed', (err as Error).message);
    }
  }

  getData(): { message: string } {
    return { message: 'Auth Service is running' };
  }
}
