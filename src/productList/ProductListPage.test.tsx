import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductListPage } from './ProductListPage'

describe('ProductListPage', () => {
  const originalFetch = globalThis.fetch
  const originalScrollTo = window.scrollTo

  beforeEach(() => {
    window.history.replaceState(
      null,
      '',
      '?category=fashion&q=coat&page=2&sort=price-desc&minPrice=10000&inStock=true',
    )
    window.scrollTo = vi.fn()
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [], totalCount: 0 }),
    } as Response)
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    window.scrollTo = originalScrollTo
    vi.restoreAllMocks()
  })

  it('initializes filters and product request from the URL', async () => {
    render(<ProductListPage />)

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/products?category=fashion&sort=price-desc&q=coat&page=2&size=12&minPrice=10000&inStock=true',
      )
    })

    expect(screen.getByRole('button', { name: '패션' })).toHaveClass('active')
    expect(screen.getByRole('searchbox')).toHaveValue('coat')
    expect(screen.getByDisplayValue('10000')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('propagates regex-like search queries through the page wiring', async () => {
    const user = userEvent.setup()

    render(<ProductListPage />)

    const searchbox = await screen.findByRole('searchbox')

    await user.clear(searchbox)
    await user.type(screen.getByRole('searchbox'), '.')

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenLastCalledWith(
        '/api/products?category=fashion&sort=price-desc&q=.&page=1&size=12&minPrice=10000&inStock=true',
      )
    })
  })
})
