import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
        // --- Tambahan: normalisasi array -> object tanpa mengubah komentarmu ---
        let normalizedErrors: Record<string, string> = {};

        if (Array.isArray(excResp.errors)) {
          // format array = [{ field, message }]
          excResp.errors.forEach((e: any) => {
            if (e?.field && e?.message) {
              normalizedErrors[e.field] = e.message;
            }
          });
        } else {
          // jika sudah berbentuk object
          normalizedErrors = excResp.errors;
        }
        // --- END tambahan ---

        body = {
          success: false,
          message: excResp.message || 'Validasi gagal',
          errors: normalizedErrors,
        };
      } else {
        // Global error
        const message = excResp.message;
        if (typeof message === 'object' && message !== null && !Array.isArray(message)) {
          body = {
            success: false,
            message: 'Validasi gagal',
            errors: message as Record<string, string>,
          };
        } else {
          body = {
            success: false,
            message: typeof excResp === 'string' ? excResp : message || 'Terjadi error',
            errors: null,
          };
        }
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
