import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const field = exception.field || 'files';
    let message = 'Kesalahan saat upload file.';
    const errors: Record<string, string> = {};

    if (exception.code === 'LIMIT_FILE_SIZE') {
      const maxSize = process.env.MAX_FILE_SIZE_MB || '1';
      message = `Ukuran file terlalu besar. Maksimal yang diizinkan adalah ${maxSize}MB.`;
      errors[field] = `File melebihi batas ${maxSize}MB.`;
    } else {
      errors[field] = message;
    }

    // Dilempar lagi sebagai HttpException agar diformat oleh HttpExceptionFilter
    throw new BadRequestException({
      message,
      errors,
    });
  }
}
