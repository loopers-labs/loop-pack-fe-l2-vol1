import type {
  AuthErrorResponse,
  AuthUser,
  LoginRequest,
  SessionResponse,
} from '@/entities/session'
import { ApiError } from '@/shared/api/apiError'

const LOGIN_ENDPOINT = '/api/auth/login'
const LOGOUT_ENDPOINT = '/api/auth/logout'
const DEFAULT_ERROR_MESSAGE = '로그인에 실패했습니다.'
const DEFAULT_LOGOUT_ERROR_MESSAGE = '로그아웃에 실패했습니다.'

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
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AuthErrorResponse | null
    throw new ApiError(
      response.status,
      errorResponse?.message ?? DEFAULT_ERROR_MESSAGE,
    )
  }

  const session = (await response.json()) as SessionResponse
  return session.user
}

export async function logout(): Promise<void> {
  const response = await fetch(LOGOUT_ENDPOINT, {
    method: 'POST',
  })

  if (response.status !== 204) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AuthErrorResponse | null
    throw new ApiError(
      response.status,
      errorResponse?.message ?? DEFAULT_LOGOUT_ERROR_MESSAGE,
    )
  }
}
