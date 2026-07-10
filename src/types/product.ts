import { z } from 'zod/v4';

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.enum(['electronics', 'fashion', 'home', 'beauty']),
  price: z.number(),
  originalPrice: z.number().nullable(),
  stock: z.number(),
  imageUrl: z.string(),
  createdAt: z.string(),
  rating: z.number(),
  reviewCount: z.number(),
  deliveryType: z.enum(['샛별배송', '판매자배송']),
  freeShipping: z.boolean(),
  description: z.string(),
  sizes: z.array(z.object({ value: z.number(), stock: z.number() })),
  options: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      stock: z.number(),
    }),
  ),
});

export type Product = z.infer<typeof ProductSchema>;

export const ProductListResponseSchema = z.object({
  products: z.array(ProductSchema),
});

export const ProductDetailResponseSchema = z.object({
  product: ProductSchema,
});
