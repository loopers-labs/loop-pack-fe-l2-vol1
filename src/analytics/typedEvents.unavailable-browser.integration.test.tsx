import { render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  delete window.__analytics
  vi.unstubAllGlobals()
  vi.resetModules()
})

it('does not let unavailable storage and crypto escape the typed event boundary', async () => {
  vi.stubGlobal('sessionStorage', undefined)
  vi.stubGlobal('crypto', undefined)
  const { trackCartAdd } = await import('./events')
  const { AnalyticsInitializer } = await import('./AnalyticsInitializer')

  expect(() => trackCartAdd({ productId: 'p1', quantity: 1 })).not.toThrow()

  render(<AnalyticsInitializer />)

  await vi.waitFor(() => {
    expect(window.__analytics).toHaveLength(1)
  })
  expect(window.__analytics).toEqual([
    {
      event: 'cart_add',
      properties: expect.objectContaining({
        productId: 'p1',
        quantity: 1,
        sessionId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
      }),
    },
  ])
})
