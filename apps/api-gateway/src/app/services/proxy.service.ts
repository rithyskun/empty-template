import { Injectable, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import * as http from 'http';
import * as https from 'https';
import { ALL_ROUTES } from '@erp/constants';

interface ProxyHandler {
  (req: Request, res: Response, next: NextFunction): void;
}

interface GatewayRequest extends Request {
  user?: {
    userId?: string;
    tenantId?: string;
    companyId?: string;
    roles?: string[];
  };
  internalService?: string;
  correlationId?: string;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitEntry {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  halfOpenCalls: number;
}

const CB_CONFIG = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30_000,
  halfOpenMaxCalls: 1,
};

const MAX_SOCKETS = Number(process.env.PROXY_MAX_SOCKETS) || 100;
const PROXY_TIMEOUT = Number(process.env.PROXY_TIMEOUT_MS) || 30_000;

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: MAX_SOCKETS });
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: MAX_SOCKETS,
});

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private proxies = new Map<string, ProxyHandler>();
  private circuits = new Map<string, CircuitEntry>();

  constructor() {
    for (const route of ALL_ROUTES) {
      const target = process.env[route.targetEnv] || route.defaultHost;
      const service = route.targetEnv;
      const isHttps = target.startsWith('https://');
      const options: Options = {
        target,
        changeOrigin: true,
        timeout: PROXY_TIMEOUT,
        agent: isHttps ? httpsAgent : httpAgent,
        pathRewrite: (path, req) => {
          const originalPath = (req as Request).originalUrl || path;
          const stripped = originalPath.replace(route.prefix, '');
          return route.pathRewrite ? route.pathRewrite + stripped : stripped;
        },
        on: {
          proxyReq: (proxyReq, req: unknown) => {
            const gReq = req as GatewayRequest;
            if (gReq.user) {
              if (gReq.user.userId)
                proxyReq.setHeader('X-User-Id', gReq.user.userId);
              if (gReq.user.tenantId)
                proxyReq.setHeader('X-Tenant-Id', gReq.user.tenantId);
              if (gReq.user.companyId)
                proxyReq.setHeader('X-Company-Id', gReq.user.companyId);
              proxyReq.setHeader(
                'X-User-Roles',
                JSON.stringify(gReq.user.roles || []),
              );
            }
            if (gReq.internalService) {
              proxyReq.setHeader('X-Internal-Service', gReq.internalService);
            }
            if (gReq.correlationId) {
              proxyReq.setHeader('X-Correlation-Id', gReq.correlationId);
            }
            // Re-stream body if express.json() already consumed it
            if (gReq.body && Object.keys(gReq.body).length > 0) {
              const bodyData = JSON.stringify(gReq.body);
              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
              proxyReq.write(bodyData);
            }
          },
          proxyRes: (proxyRes, req: unknown, res: unknown) => {
            delete proxyRes.headers['x-powered-by'];
            const gRes = res as Response;
            this.recordCircuitResult(service, gRes.statusCode);
          },
          error: (err: Error, req: unknown, res: unknown) => {
            const eReq = req as Request;
            const eRes = res as Response;
            this.logger.error(`Proxy error for ${eReq.url}: ${err.message}`);
            this.recordCircuitResult(service, 502);
            if (!eRes.headersSent) {
              eRes.status(502).json({
                success: false,
                message: 'Service unavailable',
              });
            }
          },
        },
      };
      this.proxies.set(
        route.prefix,
        createProxyMiddleware(options) as ProxyHandler,
      );
    }
  }

  getProxy(prefix: string): ProxyHandler | undefined {
    return this.proxies.get(prefix);
  }

  isCircuitOpen(service: string): boolean {
    const entry = this.getCircuit(service);
    if (entry.state !== 'OPEN') return false;

    const now = Date.now();
    if (now - entry.lastFailureTime > CB_CONFIG.recoveryTimeoutMs) {
      entry.state = 'HALF_OPEN';
      entry.halfOpenCalls = 0;
      this.logger.log(`Circuit for ${service} moved to HALF_OPEN`);
      return false;
    }
    return true;
  }

  private getCircuit(service: string): CircuitEntry {
    let entry = this.circuits.get(service);
    if (!entry) {
      entry = {
        state: 'CLOSED',
        failures: 0,
        lastFailureTime: 0,
        halfOpenCalls: 0,
      };
      this.circuits.set(service, entry);
    }
    return entry;
  }

  private recordCircuitResult(service: string, statusCode: number): void {
    const entry = this.getCircuit(service);
    const isError = statusCode >= 500 || statusCode === 0;

    if (!isError) {
      if (entry.state === 'HALF_OPEN') {
        entry.state = 'CLOSED';
        entry.failures = 0;
        entry.halfOpenCalls = 0;
        this.logger.log(`Circuit for ${service} CLOSED (recovered)`);
      }
      return;
    }

    entry.failures++;
    entry.lastFailureTime = Date.now();

    if (entry.state === 'HALF_OPEN') {
      entry.state = 'OPEN';
      this.logger.warn(`Circuit for ${service} OPEN (half-open call failed)`);
      return;
    }

    if (entry.failures >= CB_CONFIG.failureThreshold) {
      entry.state = 'OPEN';
      this.logger.warn(
        `Circuit for ${service} OPEN after ${entry.failures} failures`,
      );
    }
  }
}
