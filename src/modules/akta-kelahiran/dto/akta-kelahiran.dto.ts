import z from "zod";

const noAktaSchema = z
  .string()
  .nonempty("No. Akta wajib diisi")
  .trim()
  .regex(
    /^3520-[A-Z]{2}-\d{8}-\d{4}$/,
    "Format No. Akta tidak valid (Contoh: 3520-LU-31072002-0001)"
  ).trim().transform((val) => val.toUpperCase());

export const createSchema = z.object({
  noAkta: noAktaSchema,
  // nik: z.string().nonempty('NIK wajib diisi').trim().regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka'),
  // nama: z.string().nonempty('Nama wajib diisi').trim().transform((val) => val.toUpperCase()),
  noFisik: z.string().nonempty('Nomor Fisik wajib diisi').trim().transform((val) => val.toUpperCase()),
});

export const updateSchema = z.object({
  noAkta: noAktaSchema.optional(),
  noFisik: z.string().trim().optional().transform((val) => (val ? val.toUpperCase() : undefined)),
  fileIds: z.preprocess((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.map((v) => Number(v));
      if (typeof val === "string") return val.split(",").map((v) => Number(v.trim()));
      if (typeof val === "number") return [val];
      return undefined;
    }, z.array(z.number()).optional()),
})

export const findAllAktaSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1, 'Jumlah limit perhalaman minimal 1').max(100, 'Jumlah limit perhalaman maksimal 100').optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum([
    'id',
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