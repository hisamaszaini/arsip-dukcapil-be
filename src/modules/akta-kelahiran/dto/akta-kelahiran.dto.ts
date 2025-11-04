import z from "zod";

const noAktaSchema = z
  .string()
  .nonempty("No. Akta wajib diisi")
  .trim()
  .regex(
    /^3520-LU-\d{8}-\d{4}$/,
    "Format No. Akta tidak valid (Contoh: 3520-LU-31072002-0001)"
  );

export const createSchema = z.object({
    // nik: z.string().nonempty('NIK wajib diisi').trim().regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka'),
    noAkta: noAktaSchema,
    nama: z.string().nonempty('Nama wajib diisi').trim().transform((val) => val.toUpperCase()),
});

export const updateSchema = createSchema.partial();

export const findAllAktaSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum([
    'id',
    'noAkta',
    'nama',
    'createdAt',
  ]).optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const deleteBerkasSchema = z.object({
  fileKey: z.string().min(1, "fileKey diperlukan"),
});

export type CreateDto = z.infer<typeof createSchema>;
export type UpdateDto = z.infer<typeof updateSchema>;
export type FindAllAktaDto = z.infer<typeof findAllAktaSchema>;
export type DeleteBerkasDto = z.infer<typeof deleteBerkasSchema>;