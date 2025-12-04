import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().nonempty('Username wajib diisi').trim(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

// export const registerSchema = loginSchema.extend({
//   username: z.string().nonempty('Username wajib diisi').trim(),
//   password: z.string().min(8, 'Password minimal 8 karakter'),
//   confirmPassword: z.string().min(8, 'Password minimal 8 karakter'),
//   statusUser: statusUserEnum,
// });

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export type LoginDto = z.infer<typeof loginSchema>;
// export type RegisterDto = z.infer<typeof registerSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
