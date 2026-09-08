import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsInitializer } from './AnalyticsInitializer'
import {
  ensureClientAnalyticsConfigured,
  resetClientAnalyticsForTest,
} from './client'
import { consoleProvider } from './consoleProvider'
import { track } from './logger'

describe('AnalyticsInitializer', () => {
  beforeEach(() => {
    sessionStorage.clear()
    delete window.__analytics
  })

  afterEach(() => {
    resetClientAnalyticsForTest()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('flushes a configured queued event once and does not repeat it on rerender', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const initialize = vi.spyOn(consoleProvider, 'initialize')
    ensureClientAnalyticsConfigured()
    track('product_list_view', { page: 1 })

    const { rerender } = render(
      <StrictMode>
        <AnalyticsInitializer />
      </StrictMode>,
    )

    await vi.waitFor(() => {
      expect(window.__analytics).toHaveLength(1)
    })
    expect(window.__analytics).toEqual([
      {
        event: 'product_list_view',
        properties: expect.objectContaining({
          page: 1,
          sessionId: expect.any(String),
          ts: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          device: 'desktop',
        }),
      },
    ])

    rerender(
      <StrictMode>
        <AnalyticsInitializer />
      </StrictMode>,
    )

    expect(window.__analytics).toHaveLength(1)
    expect(initialize).toHaveBeenCalledOnce()
    expect(consoleWarn).toHaveBeenCalledOnce()
  })
})
