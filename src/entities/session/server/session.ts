import { createHmac, timingSafeEqual } from 'node:crypto'
import { SESSION_TTL_SECONDS } from '../config'
import type { AuthScenario, AuthUser } from '../model/types'

interface SessionPayload {
  userId?: unknown
  exp?: unknown
}

export const TEST_PASSWORD = 'looper1234'

const sessionSecret = (): string =>
  process.env.AUTH_SESSION_SECRET ?? 'loopers-week09-secret'

export const accounts: AuthUser[] = Array.from({ length: 8 }, (_, index) => ({
  id: `u${index + 1}`,
  name: `루퍼${index + 1}`,
  email: `looper${index + 1}@loopers.dev`,
}))

const authScenarios = [
  'invalid',
  'expired',
  'error',
  'slow',
] as const satisfies readonly AuthScenario[]

export const isAuthScenario = (value: string): value is AuthScenario =>
  authScenarios.some((scenario) => scenario === value)

export const findAccount = (
  email: string,
  password: string,
): AuthUser | null => {
  if (password !== TEST_PASSWORD) {
    return null
  }

  const normalized = email.trim().toLowerCase()
  return accounts.find((account) => account.email === normalized) ?? null
}

const sign = (payload: string): string =>
  createHmac('sha256', sessionSecret()).update(payload).digest('base64url')

export const createSessionToken = (
  userId: string,
  nowMs = Date.now(),
): string => {
  const issuedAt = Math.floor(nowMs / 1_000)
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      iat: issuedAt,
      exp: issuedAt + SESSION_TTL_SECONDS,
    }),
  ).toString('base64url')

  return `${payload}.${sign(payload)}`
}

export const readSessionToken = (
  token: string | undefined,
  nowMs = Date.now(),
): AuthUser | null => {
  if (!token) {
    return null
  }

  const [payload, signature, ...rest] = token.split('.')
  if (!payload || !signature || rest.length > 0) {
    return null
  }

  const expected = Buffer.from(sign(payload))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null
  }

  let parsed: SessionPayload
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (typeof parsed.userId !== 'string' || typeof parsed.exp !== 'number') {
    return null
  }

  if (parsed.exp * 1_000 <= nowMs) {
    return null
  }

  return accounts.find((account) => account.id === parsed.userId) ?? null
}

export const waitForAuthApi = (requestedDelayMs = 500): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, process.env.NODE_ENV === 'test' ? 0 : requestedDelayMs)
  })
