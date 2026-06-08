import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  const port = process.env.WORKFLOW_SERVICE_PORT || 8003;
  await app.listen(port);
  Logger.log(`Workflow Service running on: http://localhost:${port}/api`);
}
bootstrap();
