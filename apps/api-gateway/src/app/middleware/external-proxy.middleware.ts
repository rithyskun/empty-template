import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { AuthService } from '@erp/auth';
import { extractBearerToken } from './proxy.utils';

interface UserPayload {
  userId?: string;
  tenantId?: string;
  companyId?: string;
  roles?: string[];
}

interface ServiceRoute {
  target: string;
  rewritePrefix: string;
  public: boolean;
  pathPrefix?: string;
}

const EXTERNAL_ROUTES: Record<string, ServiceRoute> = {
  '/api/v1/auth': {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    rewritePrefix: '/api/v1/auth',
    public: true,
    pathPrefix: '/api/auth',
  },
  '/api/v1/identity': {
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:8002',
    rewritePrefix: '/api/v1/identity',
    public: false,
  },
  '/api/v1/workflow': {
    target: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:8003',
    rewritePrefix: '/api/v1/workflow',
    public: false,
  },
  '/api/v1/notifications': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8004',
    rewritePrefix: '/api/v1/notifications',
    public: false,
  },
  '/api/v1/payments': {
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8005',
    rewritePrefix: '/api/v1/payments',
    public: false,
  },
  '/api/v1/settlements': {
    target: process.env.SETTLEMENT_SERVICE_URL || 'http://localhost:8006',
    rewritePrefix: '/api/v1/settlements',
    public: false,
  },
  '/api/v1/reconciliation': {
    target: process.env.RECONCILIATION_SERVICE_URL || 'http://localhost:8008',
    rewritePrefix: '/api/v1/reconciliation',
    public: false,
  },
  '/api/v1/advances': {
    target: process.env.ADVANCE_SERVICE_URL || 'http://localhost:8010',
    rewritePrefix: '/api/v1/advances',
    public: false,
  },
  '/api/v1/reports': {
    target: process.env.REPORT_SERVICE_URL || 'http://localhost:8017',
    rewritePrefix: '/api/v1/reports',
    public: false,
  },
  '/api/v1/scheduler': {
    target: process.env.SCHEDULER_SERVICE_URL || 'http://localhost:8018',
    rewritePrefix: '/api/v1/scheduler',
    public: false,
  },
  '/api/v1/audit-logs': {
    target: process.env.AUDIT_SERVICE_URL || 'http://localhost:8021',
    rewritePrefix: '/api/v1/audit-logs',
    public: false,
  },
};

@Injectable()
export class ExternalProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ExternalProxyMiddleware.name);
  private proxies: Map<string, any> = new Map();

  constructor(private readonly authService: AuthService) {
    for (const [prefix, config] of Object.entries(EXTERNAL_ROUTES)) {
      const options: Options = {
        target: config.target,
        changeOrigin: true,
        pathRewrite: (path) => {
          const stripped = path.replace(config.rewritePrefix, '');
          return config.pathPrefix ? config.pathPrefix + stripped : stripped;
        },
        on: {
          proxyReq: (proxyReq, req: any) => {
            const user = (req as any).user as UserPayload | undefined;
            if (user) {
              if (user.userId) proxyReq.setHeader('X-User-Id', user.userId);
              if (user.tenantId)
                proxyReq.setHeader('X-Tenant-Id', user.tenantId);
              if (user.companyId)
                proxyReq.setHeader('X-Company-Id', user.companyId);
              proxyReq.setHeader(
                'X-User-Roles',
                JSON.stringify(user.roles || []),
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

  async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const matched = this.matchRoute(req.path);
    if (!matched) {
      next();
      return;
    }

    const route = EXTERNAL_ROUTES[matched];
    if (!route.public) {
      const authorized = await this.authorizeJwt(req, res);
      if (!authorized) return;
    }

    const proxy = this.proxies.get(matched);
    if (!proxy) {
      res.status(502).json({ success: false, message: 'Route unavailable' });
      return;
    }
    proxy(req, res, next);
  }

  private matchRoute(path: string): string | undefined {
    return Object.keys(EXTERNAL_ROUTES)
      .sort((a, b) => b.length - a.length)
      .find((prefix) => path.startsWith(prefix));
  }

  private async authorizeJwt(
    req: Request,
    res: Response,
  ): Promise<boolean> {
    const token = extractBearerToken(req.header('authorization'));
    if (!token) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return false;
    }

    try {
      (req as any).user = await this.authService.verifyToken(token);
      return true;
    } catch {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return false;
    }
  }
}
