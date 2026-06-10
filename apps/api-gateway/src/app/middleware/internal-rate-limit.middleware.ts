import { Injectable, NestMiddleware, OnModuleDestroy } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const INTERNAL_LIMIT = { windowMs: 60_000, max: 1000 };

@Injectable()
export class InternalRateLimitMiddleware
  implements NestMiddleware, OnModuleDestroy
{
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      db: 1,
    });
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const service = req.header('x-service-name') || 'unknown';
    const key = `ratelimit:internal:${service}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.pexpire(key, INTERNAL_LIMIT.windowMs);
    }

    const ttl = await this.redis.pttl(key);
    const resetAt = Date.now() + Math.max(0, ttl);

    res.setHeader('X-RateLimit-Limit', INTERNAL_LIMIT.max);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, INTERNAL_LIMIT.max - count),
    );
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));

    if (count > INTERNAL_LIMIT.max) {
      res.status(429).json({ success: false, message: 'Too many requests' });
      return;
    }

    next();
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }
}
