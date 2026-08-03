import * as z from 'zod'

export const ApiErrorResponseSchema = z.object({
  message: z.string().min(1),
})

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
