import { HttpException, HttpStatus } from '@nestjs/common';

export class FieldConflictException extends HttpException {
  constructor(field: string, message: string) {
    super(
      {
        message: 'Validasi gagal',
        errors: { [field]: message },
      },
      HttpStatus.CONFLICT,
    );
  }
}
