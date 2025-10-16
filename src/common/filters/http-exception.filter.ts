import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: {
      success: boolean;
      message: string;
      errors: Record<string, string> | null;
    } = {
      success: false,
      message: 'Internal server error',
      errors: null,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const excResp = exception.getResponse() as any;

      // Jika response memiliki field errors field-specific
      if (excResp?.errors) {
        body = {
          success: false,
          message: excResp.message || 'Validasi gagal',
          errors: excResp.errors,
        };
      } else {
        // Global error
        body = {
          success: false,
          message: typeof excResp === 'string' ? excResp : excResp.message || 'Terjadi error',
          errors: null,
        };
      }
    } else if (exception instanceof Error) {
      // Non-HTTP exception fallback 500
      body = {
        success: false,
        message: exception.message || 'Internal server error',
        errors: null,
      };
    }

    response.status(status).json({
      ...body,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
