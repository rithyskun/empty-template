import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from '@erp/auth';
import { ProxyMiddleware } from './middleware/proxy.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware, ProxyMiddleware).forRoutes('*');
  }
}
