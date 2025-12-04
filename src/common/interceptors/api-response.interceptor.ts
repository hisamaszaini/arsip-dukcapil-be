import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((payload) => {
        const baseResponse = {
          success: true,
          message: payload?.message ?? 'Success',
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (payload && typeof payload === 'object') {
          if ('data' in payload && 'meta' in payload) {
            return { ...baseResponse, data: payload.data, meta: payload.meta };
          }
          if ('data' in payload) {
            return { ...baseResponse, data: payload.data };
          }
        }

        return { ...baseResponse, data: payload };
      }),
    );
  }
}
