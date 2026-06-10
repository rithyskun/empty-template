import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@erp/auth';
import { ALL_ROUTES, type ServiceRoute } from '@erp/constants';
import { extractBearerToken } from './proxy.utils';
import { ProxyService } from '../services/proxy.service';

interface UserPayload {
  userId?: string;
  tenantId?: string;
  companyId?: string;
  roles?: string[];
}

interface GatewayRequest extends Request {
  user?: UserPayload;
  internalService?: string;
  correlationId?: string;
}

@Injectable()
export class GatewayMiddleware implements NestMiddleware {
  private readonly sortedPrefixes: string[];

  constructor(
    private readonly authService: AuthService,
    private readonly proxyService: ProxyService,
  ) {
    this.sortedPrefixes = ALL_ROUTES.map((r) => r.prefix).sort(
      (a, b) => b.length - a.length,
    );
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = req.originalUrl || req.path;
    const matched = this.matchRoute(path);
    if (!matched) {
      next();
      return;
    }

    const route = ALL_ROUTES.find((r) => r.prefix === matched);
    if (!route) {
      res.status(502).json({ success: false, message: 'Route unavailable' });
      return;
    }

    const service = route.targetEnv;
    const cbOpen = this.proxyService.isCircuitOpen(service);
    if (cbOpen) {
      res
        .status(503)
        .setHeader('Retry-After', 30)
        .json({ success: false, message: 'Service temporarily unavailable' });
      return;
    }

    const authorized = await this.authorize(req, res, route);
    if (!authorized) return;

    const proxy = this.proxyService.getProxy(matched);
    if (!proxy) {
      res.status(502).json({ success: false, message: 'Route unavailable' });
      return;
    }
    proxy(req, res, next);
  }

  private matchRoute(path: string): string | undefined {
    return this.sortedPrefixes.find((prefix) => path.startsWith(prefix));
  }

  private async authorize(
    req: Request,
    res: Response,
    route: ServiceRoute,
  ): Promise<boolean> {
    if (route.auth === 'public') return true;
    if (route.auth === 'internal') return true;
    return this.authorizeJwt(req, res);
  }

  private async authorizeJwt(req: Request, res: Response): Promise<boolean> {
    const token = extractBearerToken(req.header('authorization'));
    if (!token) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return false;
    }

    try {
      const gReq = req as GatewayRequest;
      gReq.user = (await this.authService.verifyToken(token)) as UserPayload;
      return true;
    } catch {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return false;
    }
  }
}
