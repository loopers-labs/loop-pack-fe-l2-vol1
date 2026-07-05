import type { ProductCategory } from './ProductCategory'

export type Product = {
  readonly id: number
  readonly name: string
  readonly category: ProductCategory
  readonly price: number
  readonly originalPrice?: number
  readonly stock: number
  readonly imageUrl: string
  readonly createdAt: string
  readonly rating: number
  readonly reviewCount: number
}
