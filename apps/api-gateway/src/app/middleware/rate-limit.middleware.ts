import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  auth: { windowMs: 60_000, max: 10 },
  read: { windowMs: 60_000, max: 300 },
  write: { windowMs: 60_000, max: 60 },
  payment: { windowMs: 60_000, max: 10 },
  bulk: { windowMs: 60_000, max: 5 },
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private store = new Map<string, RateLimitEntry>();

  use(req: Request, res: Response, next: NextFunction): void {
    const key = req.ip || 'unknown';
    const tier = this.resolveTier(req.path, req.method);
    const config = RATE_LIMITS[tier];

    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + config.windowMs };
      this.store.set(key, entry);
    }

    entry.count++;
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, config.max - entry.count),
    );
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > config.max) {
      this.logger.warn(`Rate limit exceeded for ${key} on ${req.path}`);
      res.status(429).json({ success: false, message: 'Too many requests' });
      return;
    }

    next();
  }

  private resolveTier(path: string, method: string): string {
    if (path.startsWith('/api/v1/auth')) return 'auth';
    if (path.startsWith('/api/v1/payments')) return 'payment';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return 'write';
    return 'read';
  }
}
