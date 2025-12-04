import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema, ZodIssue } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema,
    private targetType: 'body' | 'query' | 'param' | 'custom' = 'body',
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== this.targetType) {
      return value;
    }

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
