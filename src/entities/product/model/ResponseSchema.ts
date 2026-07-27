import { z } from 'zod'

// 응답 본문의 category는 'all'을 포함하지 않는다. 'all'은 목록 조회의 입력 전용 값이다.
const categoryIdSchema = z.enum([
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
])

export const categoryResponseSchema = z.object({
  id: categoryIdSchema,
  name: z.string(),
})

export const productSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  category: categoryIdSchema,
  price: z.number(),
  originalPrice: z.number().nullable(),
  image: z.string(),
  freeShipping: z.boolean(),
  sizes: z.array(z.object({ value: z.number(), stock: z.number() })),
  rating: z.number(),
  reviewCount: z.number(),
  createdAt: z.string(),
})

export const homeResponseSchema = z.object({
  banner: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
  }),
  categories: z.array(categoryResponseSchema),
  popularProducts: z.array(productSchema),
  newProducts: z.array(productSchema),
})

export const productListResponseSchema = z.object({
  products: z.array(productSchema),
  categories: z.array(categoryResponseSchema),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
