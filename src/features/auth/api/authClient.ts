import type {
  AuthErrorResponse,
  AuthUser,
  LoginRequest,
  SessionResponse,
} from '@/entities/session'
import { ApiError } from '@/shared/api/apiError'

const LOGIN_ENDPOINT = '/api/auth/login'
const DEFAULT_ERROR_MESSAGE = '로그인에 실패했습니다.'

export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await fetch(LOGIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
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
