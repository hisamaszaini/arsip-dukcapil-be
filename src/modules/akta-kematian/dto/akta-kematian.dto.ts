import z from "zod";

export const createSchema = z
  .object({
    noAkta: z.string().trim().nonempty('Nomor Akta Kematian Wajib diisi'),
    noFisik: z.string().nonempty('Nomor Fisik wajib diisi').trim().transform((val) => val.toUpperCase()),
  });

export const updateSchema = z.object({
  noAkta: z.string().trim().optional(),
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

export const findAllAktaSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1, 'Jumlah limit perhalaman minimal 1').max(100, 'Jumlah limit perhalaman maksimal 100').optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum([
    'id',
    // 'nik',
    'noAkta',
    // 'nama',
    'noFisik',
    'createdAt',
  ]).optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateDto = z.infer<typeof createSchema>;
export type UpdateDto = z.infer<typeof updateSchema>;
export type FindAllAktaDto = z.infer<typeof findAllAktaSchema>;