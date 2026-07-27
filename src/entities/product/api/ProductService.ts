import { queryOptions } from '@tanstack/react-query'

import type { ProductListQuery } from '@/entities/product/model/types'

import { ProductRepository } from './ProductRepository'

export class ProductService {
  constructor(
    private readonly repository: ProductRepository = new ProductRepository(),
  ) {}

  static queryKeyFactory = {
    home: {
      all() {
        return ['home'] as const
      },
    },
    product: {
      all() {
        return ['products'] as const
      },
      list(query: ProductListQuery) {
        return [
          ...ProductService.queryKeyFactory.product.all(),
          'list',
          query,
        ] as const
      },
    },
  }

  getHome() {
    return queryOptions({
      queryKey: ProductService.queryKeyFactory.home.all(),
      queryFn: () => this.repository.getHome(),
      staleTime: 60_000,
    })
  }

  getProductList(query: ProductListQuery) {
    return queryOptions({
      queryKey: ProductService.queryKeyFactory.product.list(query),
      queryFn: () => this.repository.getProductList(query),
      staleTime: 30_000,
    })
  }
}

export const productEntity = new ProductService()
