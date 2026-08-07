import { describe, expect, it, vi } from 'vitest'

import { ProductServerService } from '@/entities/product/api/ProductServerService'

vi.mock('server-only', () => ({}))

import ProductsPage from './page'

describe('Products page server prefetch', () => {
  it('skips deterministic error scenario prefetch', async () => {
    const getProductList = vi.spyOn(
      ProductServerService.prototype,
      'getProductList',
    )

    await ProductsPage({
      searchParams: Promise.resolve({ scenario: 'error', pageSize: '24' }),
    })

    expect(getProductList).not.toHaveBeenCalled()
  })
})
