import z from "zod";

export const createSchema = z.object({
  nik: z.string().nonempty('NIK wajib diisi').trim().regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka'),
  // nama: z.string().nonempty('Nama wajib diisi').trim().transform((val) => val.toUpperCase()),
  noFisik: z.string().nonempty('Nomor Fisik wajib diisi').trim().transform((val) => val.toUpperCase()),
});

export const updateSchema = z.object({
  nik: z.string().nonempty('NIK wajib diisi').trim().regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka').optional(),
  noFisik: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? val.toUpperCase() : undefined)),

  fileIds: z
    .preprocess((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.map((v) => Number(v));
      if (typeof val === "string") return val.split(",").map((v) => Number(v.trim()));
      if (typeof val === "number") return [val];
      return undefined;
    }, z.array(z.number()).optional()),
});

export const findAllSuratPerubahanKependudukanSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1, 'Jumlah limit perhalaman minimal 1').max(100, 'Jumlah limit perhalaman maksimal 100').optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum([
    'id',
    'nik',
    // 'nama',
    'noFisik',
    'createdAt',
  ]).optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateDto = z.infer<typeof createSchema>;
export type UpdateDto = z.infer<typeof updateSchema>;
export type FindAllSuratPerubahanKependudukanDto = z.infer<typeof findAllSuratPerubahanKependudukanSchema>;