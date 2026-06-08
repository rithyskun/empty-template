import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from '@erp/auth';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { ExternalProxyMiddleware } from './middleware/external-proxy.middleware';
import { InternalProxyMiddleware } from './middleware/internal-proxy.middleware';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RateLimitMiddleware,
        ExternalProxyMiddleware,
        InternalProxyMiddleware,
      )
      .forRoutes('*');
  }
}
