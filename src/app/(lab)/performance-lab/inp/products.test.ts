import { describe, expect, it } from 'vitest'

describe('Advanced A performance products', () => {
  it('provides exactly 24 unique cards for the measurement route', async () => {
    const { performanceLabProducts } = await import('./products')

    expect(performanceLabProducts).toHaveLength(24)
    expect(
      new Set(performanceLabProducts.map((product) => product.id)).size,
    ).toBe(24)
  })

  it('keeps the required presentation calculation deterministic and observable', async () => {
    const { calculateCardPresentation } = await import('./products')

    const first = calculateCardPresentation('p1', false)
    const repeated = calculateCardPresentation('p1', false)
    const selected = calculateCardPresentation('p1', true)

    expect(repeated).toBe(first)
    expect(selected).not.toBe(first)
    expect(Number.isInteger(first)).toBe(true)
    expect(Number.isInteger(selected)).toBe(true)
  })
})
