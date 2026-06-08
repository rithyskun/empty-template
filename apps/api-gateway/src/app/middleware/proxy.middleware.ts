import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { AuthService } from '@erp/auth';

interface ServiceRoute {
  target: string;
  auth: 'public' | 'jwt' | 'internal';
  rewritePrefix: string;
  pathPrefix?: string;
}

interface UserPayload {
  userId?: string;
  tenantId?: string;
  companyId?: string;
  roles?: string[];
}

const SERVICE_ROUTES: Record<string, ServiceRoute> = {
  '/api/v1/auth': {
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:8002',
    auth: 'public',
    rewritePrefix: '/api/v1/auth',
    pathPrefix: '/api/auth',
  },
  '/api/v1/identity': {
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:8002',
    auth: 'jwt',
    rewritePrefix: '/api/v1/identity',
    pathPrefix: '/api',
  },
  '/api/v1/workflow': {
    target: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:8003',
    auth: 'jwt',
    rewritePrefix: '/api/v1/workflow',
  },
  '/api/v1/notifications': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8004',
    auth: 'jwt',
    rewritePrefix: '/api/v1/notifications',
  },
  '/api/v1/payments': {
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8005',
    auth: 'jwt',
    rewritePrefix: '/api/v1/payments',
  },
  '/api/v1/settlements': {
    target: process.env.SETTLEMENT_SERVICE_URL || 'http://localhost:8006',
    auth: 'jwt',
    rewritePrefix: '/api/v1/settlements',
  },
  '/api/v1/reconciliation': {
    target: process.env.RECONCILIATION_SERVICE_URL || 'http://localhost:8008',
    auth: 'jwt',
    rewritePrefix: '/api/v1/reconciliation',
  },
  '/api/v1/advances': {
    target: process.env.ADVANCE_SERVICE_URL || 'http://localhost:8010',
    auth: 'jwt',
    rewritePrefix: '/api/v1/advances',
  },
  '/api/v1/reports': {
    target: process.env.REPORT_SERVICE_URL || 'http://localhost:8017',
    auth: 'jwt',
    rewritePrefix: '/api/v1/reports',
  },
  '/api/v1/scheduler': {
    target: process.env.SCHEDULER_SERVICE_URL || 'http://localhost:8018',
    auth: 'jwt',
    rewritePrefix: '/api/v1/scheduler',
  },
  '/api/v1/audit-logs': {
    target: process.env.AUDIT_SERVICE_URL || 'http://localhost:8021',
    auth: 'jwt',
    rewritePrefix: '/api/v1/audit-logs',
  },
  '/internal/v1/identity': {
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:8002',
    auth: 'internal',
    rewritePrefix: '/internal/v1/identity',
  },
  '/internal/v1/workflow': {
    target: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:8003',
    auth: 'internal',
    rewritePrefix: '/internal/v1/workflow',
  },
  '/internal/v1/notifications': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8004',
    auth: 'internal',
    rewritePrefix: '/internal/v1/notifications',
  },
  '/internal/v1/payments': {
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8005',
    auth: 'internal',
    rewritePrefix: '/internal/v1/payments',
  },
  '/internal/v1/settlements': {
    target: process.env.SETTLEMENT_SERVICE_URL || 'http://localhost:8006',
    auth: 'internal',
    rewritePrefix: '/internal/v1/settlements',
  },
  '/internal/v1/reconciliation': {
    target: process.env.RECONCILIATION_SERVICE_URL || 'http://localhost:8008',
    auth: 'internal',
    rewritePrefix: '/internal/v1/reconciliation',
  },
  '/internal/v1/advances': {
    target: process.env.ADVANCE_SERVICE_URL || 'http://localhost:8010',
    auth: 'internal',
    rewritePrefix: '/internal/v1/advances',
  },
  '/internal/v1/reports': {
    target: process.env.REPORT_SERVICE_URL || 'http://localhost:8017',
    auth: 'internal',
    rewritePrefix: '/internal/v1/reports',
  },
  '/internal/v1/scheduler': {
    target: process.env.SCHEDULER_SERVICE_URL || 'http://localhost:8018',
    auth: 'internal',
    rewritePrefix: '/internal/v1/scheduler',
  },
  '/internal/v1/audit-logs': {
    target: process.env.AUDIT_SERVICE_URL || 'http://localhost:8021',
    auth: 'internal',
    rewritePrefix: '/internal/v1/audit-logs',
  },
};

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);
  private proxies: Map<string, any> = new Map();

  constructor(private readonly authService: AuthService) {
    for (const [prefix, config] of Object.entries(SERVICE_ROUTES)) {
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
              if (user.tenantId) proxyReq.setHeader('X-Tenant-Id', user.tenantId);
              if (user.companyId)
                proxyReq.setHeader('X-Company-Id', user.companyId);
              proxyReq.setHeader(
                'X-User-Roles',
                JSON.stringify(user.roles || []),
              );
            }
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

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const matched = this.matchRoute(req.path);
    if (matched) {
      const route = SERVICE_ROUTES[matched];
      const isAuthorized = await this.authorize(req, res, route);
      if (!isAuthorized) return;
      const proxy = this.proxies.get(matched);
      if (!proxy) {
        res.status(502).json({ success: false, message: 'Route unavailable' });
        return;
      }
      proxy(req, res, next);
      return;
    }
    next();
  }

  private matchRoute(path: string): string | undefined {
    return Object.keys(SERVICE_ROUTES)
      .sort((a, b) => b.length - a.length)
      .find((prefix) => path.startsWith(prefix));
  }

  private async authorize(
    req: Request,
    res: Response,
    route: ServiceRoute,
  ): Promise<boolean> {
    if (route.auth === 'public') return true;
    if (route.auth === 'internal') return this.authorizeInternal(req, res);
    return this.authorizeJwt(req, res);
  }

  private authorizeInternal(req: Request, res: Response): boolean {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      this.logger.error('INTERNAL_SERVICE_TOKEN environment variable is required');
      res.status(503).json({ success: false, message: 'Gateway unavailable' });
      return false;
    }

    const provided =
      req.header('x-internal-service-token') ||
      this.extractBearerToken(req.header('authorization'));

    if (provided !== expected) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return false;
    }

    (req as any).internalService = req.header('x-service-name') || 'unknown';
    return true;
  }

  private async authorizeJwt(req: Request, res: Response): Promise<boolean> {
    const token = this.extractBearerToken(req.header('authorization'));
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

  private extractBearerToken(value?: string): string | undefined {
    if (!value) return undefined;
    const [scheme, token] = value.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined;
    return token;
  }
}
