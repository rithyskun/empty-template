import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { extractBearerToken } from './proxy.utils';

interface InternalRequest extends Request {
  internalService?: string;
}

@Injectable()
export class InternalAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(InternalAuthMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      this.logger.error(
        'INTERNAL_SERVICE_TOKEN environment variable is required',
      );
      res.status(503).json({ success: false, message: 'Gateway unavailable' });
      return;
    }

    const provided =
      req.header('x-internal-service-token') ||
      extractBearerToken(req.header('authorization'));

    if (provided !== expected) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const iReq = req as InternalRequest;
    iReq.internalService = req.header('x-service-name') || 'unknown';
    next();
  }
}
