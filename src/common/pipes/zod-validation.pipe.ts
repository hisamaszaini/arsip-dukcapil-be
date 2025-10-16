import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodIssue } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) { }

  transform(value: unknown) {
    if (typeof value !== 'object' || value === null) {
      throw new BadRequestException({
        message: 'Validation failed: expected an object',
        errors: {},
      });
    }

    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue: ZodIssue) => {
        const field = issue.path.join('.') || 'unknown';
        errors[field] = issue.message;
      });

      throw new BadRequestException({
        message: 'Validasi gagal',
        errors,
      });
    }

    return result.data;
  }
}
