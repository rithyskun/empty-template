import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { extractBearerToken } from './proxy.utils';

interface ServiceRoute {
  target: string;
  rewritePrefix: string;
}

const INTERNAL_ROUTES: Record<string, ServiceRoute> = {
  '/internal/v1/identity': {
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:8002',
    rewritePrefix: '/internal/v1/identity',
  },
  '/internal/v1/workflow': {
    target: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:8003',
    rewritePrefix: '/internal/v1/workflow',
  },
  '/internal/v1/notifications': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8004',
    rewritePrefix: '/internal/v1/notifications',
  },
  '/internal/v1/payments': {
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8005',
    rewritePrefix: '/internal/v1/payments',
  },
  '/internal/v1/settlements': {
    target: process.env.SETTLEMENT_SERVICE_URL || 'http://localhost:8006',
    rewritePrefix: '/internal/v1/settlements',
  },
  '/internal/v1/reconciliation': {
    target: process.env.RECONCILIATION_SERVICE_URL || 'http://localhost:8008',
    rewritePrefix: '/internal/v1/reconciliation',
  },
  '/internal/v1/advances': {
    target: process.env.ADVANCE_SERVICE_URL || 'http://localhost:8010',
    rewritePrefix: '/internal/v1/advances',
  },
  '/internal/v1/reports': {
    target: process.env.REPORT_SERVICE_URL || 'http://localhost:8017',
    rewritePrefix: '/internal/v1/reports',
  },
  '/internal/v1/scheduler': {
    target: process.env.SCHEDULER_SERVICE_URL || 'http://localhost:8018',
    rewritePrefix: '/internal/v1/scheduler',
  },
  '/internal/v1/audit-logs': {
    target: process.env.AUDIT_SERVICE_URL || 'http://localhost:8021',
    rewritePrefix: '/internal/v1/audit-logs',
  },
};

@Injectable()
export class InternalProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(InternalProxyMiddleware.name);
  private proxies: Map<string, any> = new Map();

  constructor() {
    for (const [prefix, config] of Object.entries(INTERNAL_ROUTES)) {
      const options: Options = {
        target: config.target,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(config.rewritePrefix, ''),
        on: {
          proxyReq: (proxyReq, req: any) => {
            if ((req as any).internalService) {
              proxyReq.setHeader(
                'X-Internal-Service',
                (req as any).internalService,
              );
            }
          },
          proxyRes: (proxyRes) => {
            delete proxyRes.headers['x-powered-by'];
          },
          error: (err: any, req: any, res: any) => {
            this.logger.error(`Proxy error for ${req.url}: ${err.message}`);
            if (!(res as Response).headersSent) {
              (res as Response)
                .status(502)
                .json({ success: false, message: 'Service unavailable' });
            }
          },
        },
      };
      this.proxies.set(prefix, createProxyMiddleware(options as any));
    }
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const matched = this.matchRoute(req.path);
    if (!matched) {
      next();
      return;
    }

    const authorized = this.authorizeInternal(req, res);
    if (!authorized) return;

    const proxy = this.proxies.get(matched);
    if (!proxy) {
      res.status(502).json({ success: false, message: 'Route unavailable' });
      return;
    }
    proxy(req, res, next);
  }

  private matchRoute(path: string): string | undefined {
    return Object.keys(INTERNAL_ROUTES)
      .sort((a, b) => b.length - a.length)
      .find((prefix) => path.startsWith(prefix));
  }

  private authorizeInternal(req: Request, res: Response): boolean {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      this.logger.error(
        'INTERNAL_SERVICE_TOKEN environment variable is required',
      );
      res.status(503).json({ success: false, message: 'Gateway unavailable' });
      return false;
    }

    const provided =
      req.header('x-internal-service-token') ||
      extractBearerToken(req.header('authorization'));

    if (provided !== expected) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return false;
    }

    (req as any).internalService = req.header('x-service-name') || 'unknown';
    return true;
  }
}
