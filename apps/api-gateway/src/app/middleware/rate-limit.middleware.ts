import {
  Injectable,
  NestMiddleware,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 60_000, max: 10 },
  read: { windowMs: 60_000, max: 300 },
  write: { windowMs: 60_000, max: 60 },
  payment: { windowMs: 60_000, max: 10 },
  bulk: { windowMs: 60_000, max: 5 },
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      db: 1, // use separate db for rate limits
    });
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = req.originalUrl || req.path;
    const tier = this.resolveTier(path, req.method);
    const config = RATE_LIMITS[tier];

    const identifier = this.resolveIdentifier(req);
    const key = `ratelimit:${tier}:${identifier}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.pexpire(key, config.windowMs);
    }

    const ttl = await this.redis.pttl(key);
    const resetAt = Date.now() + Math.max(0, ttl);

    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));

    if (count > config.max) {
      this.logger.warn(`Rate limit exceeded for ${identifier} on ${req.path}`);
      res.status(429).json({ success: false, message: 'Too many requests' });
      return;
    }

    next();
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }

  private resolveTier(path: string, method: string): string {
    if (path.startsWith('/api/v1/auth')) return 'auth';
    if (path.startsWith('/api/v1/payments')) return 'payment';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return 'write';
    return 'read';
  }

  private resolveIdentifier(req: Request): string {
    const userId = (req as Request & { user?: { userId?: string } }).user
      ?.userId;
    if (userId) return `user:${userId}`;
    return `ip:${req.ip || 'unknown'}`;
  }
}
