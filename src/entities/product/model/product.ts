import type { CategoryId } from '@/entities/product/model/category'

export type ProductSort = 'latest' | 'popular' | 'price-asc' | 'price-desc'

export type Product = {
  id: string
  brand: string
  name: string
  category: CategoryId
  price: number
  originalPrice: number | null
  image: string
  freeShipping: boolean
  sizes: Array<{ value: number; stock: number }>
  rating: number
  reviewCount: number
  createdAt: string
}
