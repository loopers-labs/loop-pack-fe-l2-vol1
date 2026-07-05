import {
  InvalidProductListDataError,
  InvalidProductListResponseError,
  InvalidProductTotalCountError,
} from '../errors'
import type { Product, ProductCategory } from '../types'

export class ProductList {
  products: Array<Product>
  totalCount: number

  constructor(value: unknown) {
    if (!this.isRecord(value)) {
      throw new InvalidProductListResponseError()
    }

    if (
      !Array.isArray(value.products) ||
      !value.products.every(this.isProduct.bind(this))
    ) {
      throw new InvalidProductListDataError()
    }

    if (!this.isFiniteNumber(value.totalCount)) {
      throw new InvalidProductTotalCountError()
    }

    this.products = value.products
    this.totalCount = value.totalCount
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value)
  }

  private isProductCategory(value: unknown): value is ProductCategory {
    return (
      value === 'electronics' ||
      value === 'fashion' ||
      value === 'home' ||
      value === 'beauty'
    )
  }

  private isProduct(value: unknown): value is Product {
    if (!this.isRecord(value)) {
      return false
    }

    return (
      this.isFiniteNumber(value.id) &&
      typeof value.name === 'string' &&
      this.isProductCategory(value.category) &&
      this.isFiniteNumber(value.price) &&
      (value.originalPrice === undefined ||
        this.isFiniteNumber(value.originalPrice)) &&
      this.isFiniteNumber(value.stock) &&
      typeof value.imageUrl === 'string' &&
      typeof value.createdAt === 'string' &&
      this.isFiniteNumber(value.rating) &&
      this.isFiniteNumber(value.reviewCount)
    )
  }
}
