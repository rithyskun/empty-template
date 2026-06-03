import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    Logger.error('JWT_SECRET environment variable is required');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors();
  app.enableShutdownHooks();

  const port = process.env.PORT || 3002;
  await app.listen(port);
  Logger.log(
    `Identity Service is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
