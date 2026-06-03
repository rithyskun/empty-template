import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

const SERVICE_ROUTES: Record<string, { target: string; auth: boolean }> = {
  '/api/v1/auth': {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    auth: false,
  },
  '/api/v1/identity': {
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002',
    auth: true,
  },
  '/api/v1/workflow': {
    target: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:3003',
    auth: true,
  },
  '/api/v1/notifications': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    auth: true,
  },
  '/api/v1/payments': {
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    auth: true,
  },
  '/api/v1/settlements': {
    target: process.env.SETTLEMENT_SERVICE_URL || 'http://localhost:3006',
    auth: true,
  },
  '/api/v1/reconciliation': {
    target: process.env.RECONCILIATION_SERVICE_URL || 'http://localhost:3008',
    auth: true,
  },
  '/api/v1/advances': {
    target: process.env.ADVANCE_SERVICE_URL || 'http://localhost:3010',
    auth: true,
  },
  '/api/v1/reports': {
    target: process.env.REPORT_SERVICE_URL || 'http://localhost:3017',
    auth: true,
  },
  '/api/v1/scheduler': {
    target: process.env.SCHEDULER_SERVICE_URL || 'http://localhost:3018',
    auth: true,
  },
  '/api/v1/audit-logs': {
    target: process.env.AUDIT_SERVICE_URL || 'http://localhost:3021',
    auth: true,
  },
};

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);
  private proxies: Map<string, any> = new Map();

  constructor() {
    for (const [prefix, config] of Object.entries(SERVICE_ROUTES)) {
      const options: Options = {
        target: config.target,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(prefix, ''),
        on: {
          proxyReq: (proxyReq, req: any) => {
            if ((req as any).user) {
              proxyReq.setHeader('X-User-Id', (req as any).user.userId);
              proxyReq.setHeader('X-Tenant-Id', (req as any).user.tenantId);
              proxyReq.setHeader(
                'X-User-Roles',
                JSON.stringify((req as any).user.roles),
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
    const matched = Object.keys(SERVICE_ROUTES).find((prefix) =>
      req.path.startsWith(prefix),
    );
    if (matched) {
      const proxy = this.proxies.get(matched)!;
      proxy(req, res, next);
      return;
    }
    next();
  }
}
