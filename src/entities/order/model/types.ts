import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

export const orderSchema = z.object({
  id: z.string(),
  createdAt: z.iso.datetime(),
  items: z.array(orderItemSchema),
});

export const orderCreateRequestSchema = z.object({
  items: z.array(orderItemSchema).min(1),
});

export const orderCreateResponseSchema = z.object({
  order: orderSchema,
});

export const orderListResponseSchema = z.object({
  orders: z.array(orderSchema),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderCreateRequest = z.infer<typeof orderCreateRequestSchema>;
export type OrderCreateResponse = z.infer<typeof orderCreateResponseSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
