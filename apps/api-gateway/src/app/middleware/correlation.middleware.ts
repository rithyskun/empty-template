import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

interface CorrelationRequest extends Request {
  correlationId?: string;
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const cReq = req as CorrelationRequest;
    cReq.correlationId = req.header('x-correlation-id') || randomUUID();

    res.setHeader('X-Correlation-Id', cReq.correlationId);
    res.setHeader('X-Request-Id', randomUUID());

    next();
  }
}
