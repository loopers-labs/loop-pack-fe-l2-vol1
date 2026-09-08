import type { AuthUser, LoginRequest } from '@/entities/session'
import { ApiError } from '@/shared/api/apiError'

const LOGIN_ENDPOINT = '/api/auth/login'
const LOGOUT_ENDPOINT = '/api/auth/logout'
const DEFAULT_ERROR_MESSAGE = '로그인에 실패했습니다.'
const DEFAULT_LOGOUT_ERROR_MESSAGE = '로그아웃에 실패했습니다.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  )
}

function getErrorMessage(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.message === 'string'
    ? value.message
    : fallback
}

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null)
}

export async function login(
  credentials: LoginRequest,
  signal?: AbortSignal,
): Promise<AuthUser> {
  const response = await fetch(LOGIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
    signal,
  })

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getErrorMessage(await readJson(response), DEFAULT_ERROR_MESSAGE),
    )
  }

  const session = await readJson(response)

  if (!isRecord(session) || !isAuthUser(session.user)) {
    throw new ApiError(response.status, DEFAULT_ERROR_MESSAGE)
  }

  return session.user
}

export async function logout(signal?: AbortSignal): Promise<void> {
  const response = await fetch(LOGOUT_ENDPOINT, {
    method: 'POST',
    signal,
  })

  if (response.status !== 204) {
    throw new ApiError(
      response.status,
      getErrorMessage(await readJson(response), DEFAULT_LOGOUT_ERROR_MESSAGE),
    )
  }
}
