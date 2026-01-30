import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const { method, url, ip, body } = req;
    const userAgent = req.get('user-agent') ?? '';
    const start = Date.now();

    this.logger.log(
      `--> ${method} ${url} ${ip} ${userAgent} ${body && Object.keys(body).length ? `body: ${JSON.stringify(body)}` : ''}`.trim(),
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const res = http.getResponse();
          const statusCode = res.statusCode;
          const duration = Date.now() - start;
          this.logger.log(
            `<-- ${method} ${url} ${statusCode} ${duration}ms`,
          );
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logger.warn(
            `<-- ${method} ${url} ERROR ${duration}ms ${err?.message ?? err}`,
          );
        },
      }),
    );
  }
}
