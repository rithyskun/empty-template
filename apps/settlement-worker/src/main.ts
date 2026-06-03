import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  if (process.env.HEALTH_PORT) {
    app.setGlobalPrefix('api');
    await app.listen(process.env.HEALTH_PORT);
    Logger.log(
      `Settlement Worker health check on port ${process.env.HEALTH_PORT}`,
    );
  } else {
    await app.init();
    Logger.log('Settlement Worker started (no HTTP listener)');
  }
}

bootstrap();
