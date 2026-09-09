import { describe, expect, it } from 'vitest'

import { readAnalyticsDevice } from './client'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  })
}

describe('readAnalyticsDevice', () => {
  it.each([
    [390, 'mobile'],
    [767, 'mobile'],
    [768, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
    [1440, 'desktop'],
  ] as const)('classifies %ipx as %s', (width, expected) => {
    setViewportWidth(width)

    expect(readAnalyticsDevice()).toBe(expected)
  })

  it('stores the tab session id in sessionStorage', () => {
    expect(
      window.sessionStorage.getItem('commerce-analytics-session-id'),
    ).toMatch(/^s_/)
  })
})
