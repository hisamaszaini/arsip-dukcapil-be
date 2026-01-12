import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

// ==========================================
// 1. ERROR CONTEXT TYPES
// ==========================================

export interface ErrorContext {
  operation: 'create' | 'update' | 'delete' | 'find' | 'findMany';
  entity: string;
  field?: string;
}

export interface ErrorMessages {
  [key: string]: string;
}

// ==========================================
// 2. ERROR MESSAGE TEMPLATES
// ==========================================

const OPERATION_MESSAGES = {
  create: 'membuat',
  update: 'memperbarui',
  delete: 'menghapus',
  find: 'mencari',
  findMany: 'mengambil daftar',
} as const;

const PRISMA_ERROR_MESSAGES = {
  P2002: 'sudah digunakan',
  P2003: 'Relasi tidak valid atau data terkait tidak ditemukan',
  P2025: 'tidak ditemukan',
  P2010: 'Query tidak valid',
  P2014:
    'Perubahan yang Anda coba lakukan akan melanggar relasi yang diperlukan',
  P2016: 'Error dalam interpretasi query',
  P2017: 'Relasi tidak terhubung',
  P2018: 'Relasi yang diperlukan tidak ditemukan',
  P2019: 'Error input',
  P2020: 'Nilai di luar rentang yang diizinkan',
  P2021: 'Tabel tidak ada dalam database',
  P2022: 'Kolom tidak ada dalam database',
} as const;

// ==========================================
// 3. ENHANCED ERROR HANDLER
// ==========================================

export function handlePrismaError(
  error: unknown,
  context?: ErrorContext,
): never {
  const defaultContext: ErrorContext = {
    operation: 'create',
    entity: 'data',
  };

  const ctx = { ...defaultContext, ...context };
  const operationText = OPERATION_MESSAGES[ctx.operation];

  if (error instanceof HttpException) {
    throw error;
  }

  // Handle Prisma Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      const rawTargets = error.meta?.target;
      const targets = Array.isArray(rawTargets) ? rawTargets : [rawTargets];

      const messages: ErrorMessages = {};
      for (const field of targets) {
        if (typeof field === 'string') {
          messages[field] = `${field} ${PRISMA_ERROR_MESSAGES.P2002}`;
        }
      }

      throw new BadRequestException({
        success: false,
        message: messages,
        data: null,
      });
    }

    // P2003: Foreign key constraint failed
    if (error.code === 'P2003') {
      const fieldName = error.meta?.field_name as string | undefined;
      const constraint = error.meta?.constraint as string | undefined;

      let field = fieldName || 'relasi';

      // Try to parse field from constraint name like "Table_column_fkey"
      if (!fieldName && constraint) {
        const match = constraint.match(/_([a-zA-Z0-9]+)_fkey$/);
        if (match && match[1]) {
          field = match[1];
        } else {
          field = constraint;
        }
      }

      throw new BadRequestException({
        success: false,
        message: {
          [field]: PRISMA_ERROR_MESSAGES.P2003,
        },
        data: null,
      });
    }

    // P2022: Column does not exist
    if (error.code === 'P2022') {
      // Prisma menyediakan column_name atau columns[]
      const columns: string[] = [];

      // column_name bisa object, jadi cek dulu tipe string
      const rawColumnName = error.meta?.column_name;
      if (typeof rawColumnName === 'string') {
        columns.push(rawColumnName);
      }

      // columns[] bisa campuran type, jadi filter hanya string
      const rawColumns = error.meta?.columns;
      if (Array.isArray(rawColumns)) {
        rawColumns.forEach((c) => {
          if (typeof c === 'string') {
            columns.push(c);
          }
        });
      }

      const uniqueColumns = [...new Set(columns)];

      const colList =
        uniqueColumns.length > 0 ? uniqueColumns.join(', ') : 'yang diminta';

      throw new BadRequestException({
        success: false,
        message: `${ctx.entity}: Kolom ${colList} tidak ada dalam database`,
        data: null,
      });
    }

    // P2025: Record not found
    if (error.code === 'P2025') {
      throw new NotFoundException({
        success: false,
        message: `${ctx.entity} ${PRISMA_ERROR_MESSAGES.P2025}`,
        data: null,
      });
    }

    // Handle other Prisma error codes
    const errorMessage =
      PRISMA_ERROR_MESSAGES[error.code as keyof typeof PRISMA_ERROR_MESSAGES];
    if (errorMessage) {
      throw new BadRequestException({
        success: false,
        message: {
          [ctx.entity]: errorMessage,
        },
        data: null,
      });
    }
  }

  // Handle Prisma Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new BadRequestException({
      success: false,
      message: {
        validation: 'Data yang diberikan tidak valid',
      },
      data: null,
    });
  }

  // Handle Prisma Connection Errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new InternalServerErrorException({
      success: false,
      message: {
        database: 'Gagal terhubung ke database',
      },
      data: null,
    });
  }

  // Default fallback
  throw new InternalServerErrorException({
    success: false,
    message: {
      [ctx.entity]: `Gagal ${operationText} ${ctx.entity}`,
    },
    data: null,
  });
}

// ==========================================
// 4. SPECIALIZED ERROR HANDLERS
// ==========================================

export function handleCreateError(error: unknown, entity: string): never {
  handlePrismaError(error, { operation: 'create', entity });
}

export function handleUpdateError(error: unknown, entity: string): never {
  handlePrismaError(error, { operation: 'update', entity });
}

export function handleDeleteError(error: unknown, entity: string): never {
  handlePrismaError(error, { operation: 'delete', entity });
}

export function handleFindError(error: unknown, entity: string): never {
  handlePrismaError(error, { operation: 'find', entity });
}

export function handleFindManyError(error: unknown, entity: string): never {
  handlePrismaError(error, { operation: 'findMany', entity });
}
