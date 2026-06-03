import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { ApiResponse } from '@erp/common';

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return { success: true, message: 'Success', data };
      }),
    );
  }
}
