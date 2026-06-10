import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from '@erp/auth';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { CorrelationMiddleware } from './middleware/correlation.middleware';
import { InternalAuthMiddleware } from './middleware/internal-auth.middleware';
import { InternalRateLimitMiddleware } from './middleware/internal-rate-limit.middleware';
import { GatewayMiddleware } from './middleware/gateway.middleware';
import { SecurityMiddleware } from './middleware/security.middleware';
import { HealthController } from './controllers/health.controller';
import { ProxyService } from './services/proxy.service';

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: [ProxyService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');

    consumer.apply(SecurityMiddleware).forRoutes('*');

    consumer
      .apply(
        InternalAuthMiddleware,
        InternalRateLimitMiddleware,
        GatewayMiddleware,
      )
      .forRoutes('/internal/v1/*path');

    consumer
      .apply(RateLimitMiddleware, GatewayMiddleware)
      .forRoutes('/api/v1/*path');
  }
}
