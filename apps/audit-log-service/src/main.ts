import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  const port = process.env.AUDIT_SERVICE_PORT || 8021;
  await app.listen(port);
  Logger.log(`Audit Log Service running on: http://localhost:${port}/api`);
}

bootstrap();
