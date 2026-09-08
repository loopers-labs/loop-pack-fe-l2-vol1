import { afterEach, describe, expect, it, vi } from 'vitest'
import { consoleProvider } from './consoleProvider'

describe('consoleProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('records tracked events and warns for each provider operation', () => {
    vi.stubGlobal('window', {})
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    consoleProvider.initialize()
    consoleProvider.track('cart_add', { productId: 'p1', quantity: 1 })
    consoleProvider.identify('u1')
    consoleProvider.reset()

    expect(window.__analytics).toEqual([
      { event: 'cart_add', properties: { productId: 'p1', quantity: 1 } },
    ])
    expect(consoleWarn).toHaveBeenCalledTimes(3)
  })
})
