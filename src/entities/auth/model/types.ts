import { z } from 'zod';

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export const sessionResponseSchema = z.object({
  user: authUserSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export interface LoginRequest {
  email: string;
  password: string;
}
