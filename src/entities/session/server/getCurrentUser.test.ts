import { cookies } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accounts, createSessionToken } from '@/entities/session/server'
import { SESSION_COOKIE } from '@/entities/session/config'
import { getCurrentUser } from './getCurrentUser'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

const mockedCookies = vi.mocked(cookies)

const cookieStoreWith = (token?: string): Awaited<ReturnType<typeof cookies>> =>
  ({
    get: (name: string) =>
      name === SESSION_COOKIE && token !== undefined
        ? { name: SESSION_COOKIE, value: token }
        : undefined,
  }) as Awaited<ReturnType<typeof cookies>>

describe('getCurrentUser', () => {
  beforeEach(() => {
    mockedCookies.mockReset()
  })

  it('returns null when the session cookie is absent', async () => {
    mockedCookies.mockResolvedValue(cookieStoreWith())

    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it('returns the signed-in user from a valid session cookie', async () => {
    mockedCookies.mockResolvedValue(
      cookieStoreWith(createSessionToken(accounts[0].id)),
    )

    await expect(getCurrentUser()).resolves.toEqual(accounts[0])
  })

  it('returns null when the session cookie signature is tampered', async () => {
    const token = createSessionToken(accounts[0].id)
    mockedCookies.mockResolvedValue(cookieStoreWith(`${token}x`))

    await expect(getCurrentUser()).resolves.toBeNull()
  })
})
