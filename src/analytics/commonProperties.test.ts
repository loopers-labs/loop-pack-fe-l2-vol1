import { afterEach, describe, expect, it, vi } from 'vitest'

const SESSION_STORAGE_KEY = 'loopers.analytics.session-id'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface SessionStorageStub {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function createSessionStorage(): SessionStorageStub {
  const values = new Map<string, string>()

  return {
    getItem: (key: string): string | null => values.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      values.set(key, value)
    },
  }
}

function setBrowserViewport(width: number): SessionStorageStub {
  const storage = createSessionStorage()
  vi.stubGlobal('window', { innerWidth: width })
  vi.stubGlobal('sessionStorage', storage)
  return storage
}

async function loadGetCommonAnalyticsProperties(): Promise<
  typeof import('./commonProperties').getCommonAnalyticsProperties
> {
  const { getCommonAnalyticsProperties } = await import('./commonProperties')
  return getCommonAnalyticsProperties
}

describe('getCommonAnalyticsProperties', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('returns a session ID, current timestamp, and mobile device for a narrow viewport', async () => {
    setBrowserViewport(767)
    const getCommonAnalyticsProperties =
      await loadGetCommonAnalyticsProperties()

    expect(getCommonAnalyticsProperties()).toMatchObject({
      sessionId: expect.any(String),
      ts: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      device: 'mobile',
    })
  })

  it('reuses the session ID saved in the current browser tab', async () => {
    const storage = setBrowserViewport(1024)
    const getCommonAnalyticsProperties =
      await loadGetCommonAnalyticsProperties()

    const first = getCommonAnalyticsProperties()
    const second = getCommonAnalyticsProperties()

    expect(second.sessionId).toBe(first.sessionId)
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBe(first.sessionId)
  })

  it.each(['', 'customer@example.com'])(
    'replaces a corrupt stored session ID with a generated UUID',
    async (storedSessionId: string) => {
      const storage = setBrowserViewport(1024)
      storage.setItem(SESSION_STORAGE_KEY, storedSessionId)
      const getCommonAnalyticsProperties =
        await loadGetCommonAnalyticsProperties()

      const properties = getCommonAnalyticsProperties()

      expect(properties.sessionId).toEqual(expect.stringMatching(UUID_PATTERN))
      expect(storage.getItem(SESSION_STORAGE_KEY)).toBe(properties.sessionId)
    },
  )

  it.each([
    [767, 'mobile'],
    [768, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
  ])(
    'classifies a %ipx viewport as %s',
    async (width: number, device: string) => {
      setBrowserViewport(width)
      const getCommonAnalyticsProperties =
        await loadGetCommonAnalyticsProperties()

      expect(getCommonAnalyticsProperties().device).toBe(device)
    },
  )

  it('uses one stable in-memory session ID when storage access throws', async () => {
    vi.stubGlobal('window', { innerWidth: 1024 })
    vi.stubGlobal('sessionStorage', {
      getItem: (): never => {
        throw new Error('Storage access denied')
      },
      setItem: (): never => {
        throw new Error('Storage access denied')
      },
    })
    const getCommonAnalyticsProperties =
      await loadGetCommonAnalyticsProperties()

    const first = getCommonAnalyticsProperties()
    const second = getCommonAnalyticsProperties()

    expect(second.sessionId).toBe(first.sessionId)
    expect(first.sessionId).toEqual(expect.any(String))
  })

  it('uses a stable UUID-v4 session ID when storage and crypto are unavailable', async () => {
    vi.stubGlobal('window', { innerWidth: 1024 })
    vi.stubGlobal('sessionStorage', undefined)
    vi.stubGlobal('crypto', undefined)
    const getCommonAnalyticsProperties =
      await loadGetCommonAnalyticsProperties()

    expect(() => getCommonAnalyticsProperties()).not.toThrow()
    const first = getCommonAnalyticsProperties()
    const second = getCommonAnalyticsProperties()

    expect(first.sessionId).toEqual(expect.stringMatching(UUID_PATTERN))
    expect(second.sessionId).toBe(first.sessionId)
  })

  it('uses a stable UUID-v4 session ID when storage and randomUUID throw', async () => {
    vi.stubGlobal('window', { innerWidth: 1024 })
    vi.stubGlobal('sessionStorage', {
      getItem: (): never => {
        throw new Error('Storage access denied')
      },
      setItem: (): never => {
        throw new Error('Storage access denied')
      },
    })
    vi.stubGlobal('crypto', {
      randomUUID: (): never => {
        throw new Error('Secure random unavailable')
      },
    })
    const getCommonAnalyticsProperties =
      await loadGetCommonAnalyticsProperties()

    expect(() => getCommonAnalyticsProperties()).not.toThrow()
    const first = getCommonAnalyticsProperties()
    const second = getCommonAnalyticsProperties()

    expect(first.sessionId).toEqual(expect.stringMatching(UUID_PATTERN))
    expect(second.sessionId).toBe(first.sessionId)
  })

  it('uses an in-memory session ID without browser storage during SSR evaluation', async () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('sessionStorage', undefined)
    const getCommonAnalyticsProperties =
      await loadGetCommonAnalyticsProperties()

    const first = getCommonAnalyticsProperties()
    const second = getCommonAnalyticsProperties()

    expect(first.device).toBeNull()
    expect(second.sessionId).toBe(first.sessionId)
    expect(first.sessionId).toEqual(expect.any(String))
  })

  it('evaluates the timestamp each time properties are requested', async () => {
    setBrowserViewport(1024)
    vi.useFakeTimers()
    const getCommonAnalyticsProperties =
      await loadGetCommonAnalyticsProperties()
    vi.setSystemTime(new Date('2026-09-03T00:00:00.000Z'))
    const first = getCommonAnalyticsProperties()
    vi.setSystemTime(new Date('2026-09-03T00:00:01.000Z'))
    const second = getCommonAnalyticsProperties()

    expect(first.ts).toBe('2026-09-03T00:00:00.000Z')
    expect(second.ts).toBe('2026-09-03T00:00:01.000Z')
  })
})
