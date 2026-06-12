import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors();
  const port = process.env.FILE_SERVICE_PORT || 8015;
  await app.listen(port);
  Logger.log(
    `🚀 File Service running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
