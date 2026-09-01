import { describe, expect, it, vi } from 'vitest'

import type { AnalyticsProvider, EventProperties } from './provider'

type CapturedTrack = {
  readonly type: 'track'
  readonly event: string
  readonly properties: EventProperties
}

type CapturedCall =
  | CapturedTrack
  | { readonly type: 'identify'; readonly userId: string }
  | { readonly type: 'reset' }

const calls: Array<CapturedCall> = []

const captureProvider: AnalyticsProvider = {
  name: 'capture',
  initialize() {},
  track: (event, properties) => {
    calls.push({ type: 'track', event, properties })
  },
  identify: (userId) => {
    calls.push({ type: 'identify', userId })
  },
  reset: () => {
    calls.push({ type: 'reset' })
  },
}

import './client'

import { initAnalytics, registerProviders, track } from './logger'

registerProviders([captureProvider])

const tracked = () =>
  calls.filter((call): call is CapturedTrack => call.type === 'track')

describe('analytics bootstrap', () => {
  it('sends events queued before initialization in order after init', async () => {
    track('early_event', { step: 1 })
    track('early_second', { step: 2 })

    await initAnalytics()

    expect(tracked().map((call) => call.event)).toEqual([
      'early_event',
      'early_second',
    ])
  })

  it('attaches sessionId, ts, device common properties at occurrence time', async () => {
    await initAnalytics()

    track('common_event')

    const call = tracked().find((item) => item.event === 'common_event')
    expect(call).toBeDefined()
    const { properties } = call as CapturedTrack
    expect(String(properties.sessionId)).toMatch(/^s_/)
    expect(() => new Date(String(properties.ts)).toISOString()).not.toThrow()
    expect(properties.device).toBeNull()
  })

  it('keeps one sessionId for the module instance', async () => {
    await initAnalytics()

    track('first')
    track('second')

    const ids = new Set(
      tracked()
        .filter((call) => ['first', 'second'].includes(call.event))
        .map((call) => String(call.properties.sessionId)),
    )
    expect(ids.size).toBe(1)
  })

  it('evaluates ts when the event occurs', async () => {
    await initAnalytics()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-01T00:00:00.000Z'))
    track('time_one')
    vi.setSystemTime(new Date('2026-09-01T00:00:05.000Z'))
    track('time_two')
    vi.useRealTimers()

    const byEvent = Object.fromEntries(
      tracked()
        .filter((call) => ['time_one', 'time_two'].includes(call.event))
        .map((call) => [call.event, String(call.properties.ts)]),
    )
    expect(byEvent.time_one).toBe('2026-09-01T00:00:00.000Z')
    expect(byEvent.time_two).toBe('2026-09-01T00:00:05.000Z')
  })
})
