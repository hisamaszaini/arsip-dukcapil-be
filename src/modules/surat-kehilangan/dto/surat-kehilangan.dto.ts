import z from "zod";

export const createSchema = z.object({
    nik: z.string().nonempty('NIK wajib diisi').trim().regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka'),
    nama: z.string().nonempty('Nama wajib diisi').trim(),
});

export const updateSchema = createSchema.partial();

export const findAllSuratKehilanganSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum([
    'id',
    'nik',
    'nama',
    'createdAt',
  ]).optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateDto = z.infer<typeof createSchema>;
export type UpdateDto = z.infer<typeof updateSchema>;
export type FindAllSuratKehilanganDto = z.infer<typeof findAllSuratKehilanganSchema>;