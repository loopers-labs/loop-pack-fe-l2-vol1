import * as z from 'zod'

export const orderItemSchema = z.object({
  productId: z.string().regex(/^p(?:[1-9]|1\d|2\d|30)$/),
  quantity: z.int().positive(),
})

export const orderSchema = z.object({
  id: z.string().min(1),
  createdAt: z.iso.datetime(),
  items: z.array(orderItemSchema).min(1),
})

export const orderCreateResponseSchema = z.object({
  order: orderSchema,
})

export const orderListResponseSchema = z.object({
  orders: z.array(orderSchema),
})

export type OrderItem = z.infer<typeof orderItemSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderCreateResponse = z.infer<typeof orderCreateResponseSchema>
export type OrderListResponse = z.infer<typeof orderListResponseSchema>
