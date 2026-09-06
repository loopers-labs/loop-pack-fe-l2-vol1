import { z } from 'zod';

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export const sessionResponseSchema = z.object({
  user: authUserSchema,
});

export const loginRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthErrorResponse = { message: string };
