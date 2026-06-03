import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { ApiResponse } from '@erp/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const resp = response as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        if (Array.isArray(resp.message)) {
          errors = resp.message as unknown[];
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const body: ApiResponse = {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    };

    httpAdapter.reply(ctx.getResponse(), body, status);
  }
}
