import z from 'zod';

export const createArsipSchema = z.object({
  idKategori: z.coerce.number(),
  no: z.string().trim().nonempty('Nomor Akta Kematian Wajib diisi'),
  nama: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .optional(),
  tanggal: z.coerce
    .date({ message: 'Tanggal wajib diisi' })
    .refine((val) => !isNaN(val.getTime()), {
      message: 'Format tanggal tidak valid',
    })
    .optional(),
  noFisik: z
    .string()
    .nonempty('Nomor Fisik wajib diisi')
    .trim()
    .transform((val) => val.toUpperCase()),
});

export const createArsipBySlugSchema = createArsipSchema.omit({
  idKategori: true,
});

export const updateArsipSchema = createArsipSchema.partial().extend({
  fileIds: z
    .union([
      z.array(z.union([z.string(), z.number()])),
      z.string().transform((val) => [val]),
      z.number().transform((val) => [val]),
    ])
    .optional()
    .transform((val) => (val ? val.map((v) => Number(v)) : undefined)),
});

export const findAllArsipSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).optional().default(20),
  search: z.string().optional(),
  sortBy: z
    .enum(['id', 'no', 'nama', 'noFisik', 'createdAt', 'updatedAt'])
    .optional()
    .default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  kategoriId: z.coerce.number().optional(),
});

export type CreateArsipDto = z.infer<typeof createArsipSchema>;
export type CreateArsipBySlugDto = z.infer<typeof createArsipBySlugSchema>;
export type UpdateArsipDto = z.infer<typeof updateArsipSchema>;
export type FindAllArsipDto = z.infer<typeof findAllArsipSchema>;
