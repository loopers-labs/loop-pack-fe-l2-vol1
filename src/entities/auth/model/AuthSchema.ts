import * as z from 'zod'

export const authUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
})

export const sessionResponseSchema = z.object({
  user: authUserSchema,
})

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export type AuthUser = z.infer<typeof authUserSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
