import { z } from 'zod';

export const CreateKategoriSchema = z.object({
  name: z.string().min(1, { message: 'Nama kategori wajib diisi' }),
  description: z.string().optional(),
  formNo: z.string().nonempty({ message: 'Nama Nomor Form wajib diisi' }),
  rulesFormNo: z.boolean().default(true),
  rulesFormNama: z.boolean(),
  rulesFormTanggal: z.boolean(),
  maxFile: z
    .number()
    .int()
    .min(1, { message: 'Minimal jumlah file adalah 1' })
    .max(30, { message: 'Maksimal jumlah file adalah 30' }),
  isEncrypt: z.boolean().default(false),

  // Dynamic Validation Rules
  noType: z.enum(['NUMERIC', 'ALPHANUMERIC', 'CUSTOM']).default('ALPHANUMERIC'),
  noMinLength: z.number().int().optional(),
  noMaxLength: z.number().int().optional(),
  noRegex: z.string().optional(),
  noPrefix: z.string().optional(),
  noFormat: z.string().optional(),
  noMask: z.string().optional(),
  uniqueConstraint: z
    .enum(['NONE', 'NO', 'NO_TANGGAL', 'NO_NOFISIK'])
    .default('NONE'),
});

export const UpdateKategoriSchema = CreateKategoriSchema.partial();

export const findAllKategoriSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).optional().default(20),
  search: z.string().optional(),
  sortBy: z
    .enum(['id', 'name', 'createdAt', 'updatedAt'])
    .optional()
    .default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateKategoriDto = z.infer<typeof CreateKategoriSchema>;
export type UpdateKategoriDto = z.infer<typeof UpdateKategoriSchema>;
export type FindAllKategoriDto = z.infer<typeof findAllKategoriSchema>;
