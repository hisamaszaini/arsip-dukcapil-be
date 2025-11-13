import z from "zod";

export const createSchema = z.object({
  nik: z.string().nonempty('NIK wajib diisi').trim().regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka'),
  // nama: z.string().nonempty('Nama wajib diisi').trim().transform((val) => val.toUpperCase()),
  tanggal: z.coerce.date({ message: 'Tanggal wajib diisi' })
    .refine((val) => !isNaN(val.getTime()), { message: 'Format tanggal tidak valid' }),
  noFisik: z.string().nonempty('Nomor Fisik wajib diisi').trim().transform((val) => val.toUpperCase()),
});

export const updateSchema = createSchema.partial();

export const findAllSuratKehilanganSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1, 'Jumlah limit perhalaman minimal 1').max(100, 'Jumlah limit perhalaman maksimal 100').optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum([
    'id',
    'nik',
    // 'nama',
    'noFisik',
    'tanggal',
    'createdAt',
  ]).optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateDto = z.infer<typeof createSchema>;
export type UpdateDto = z.infer<typeof updateSchema>;
export type FindAllSuratKehilanganDto = z.infer<typeof findAllSuratKehilanganSchema>;