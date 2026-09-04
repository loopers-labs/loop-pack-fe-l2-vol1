import { describe, expect, it, vi } from 'vitest'

import { accounts, createSessionToken } from '@/app/api/_data/auth'
import { SESSION_TTL_SECONDS } from '@/app/api/_data/auth-cookies'

vi.mock('server-only', () => ({}))

import { resolveAuthSession } from './AuthSession'

const nowMs = Date.UTC(2026, 8, 1, 0, 0, 0)

describe('resolveAuthSession', () => {
  it('returns anonymous when the session cookie is absent', () => {
    expect(
      resolveAuthSession({ token: undefined, scenario: undefined }, nowMs),
    ).toEqual({ status: 'anonymous' })
  })

  it('returns the authenticated user for a valid signed token', () => {
    const token = createSessionToken(accounts[0].id, nowMs)

    expect(resolveAuthSession({ token, scenario: undefined }, nowMs)).toEqual({
      status: 'authenticated',
      user: accounts[0],
    })
  })

  it.each(['tampered', 'expired'] as const)(
    'returns expired for a %s session token',
    (kind) => {
      const token =
        kind === 'tampered'
          ? `${createSessionToken(accounts[0].id, nowMs)}x`
          : createSessionToken(
              accounts[0].id,
              nowMs - (SESSION_TTL_SECONDS + 1) * 1_000,
            )

      expect(resolveAuthSession({ token, scenario: undefined }, nowMs)).toEqual(
        { status: 'expired' },
      )
    },
  )

  it('uses the expired scenario instead of a valid token', () => {
    const token = createSessionToken(accounts[0].id, nowMs)

    expect(resolveAuthSession({ token, scenario: 'expired' }, nowMs)).toEqual({
      status: 'expired',
    })
  })
})
