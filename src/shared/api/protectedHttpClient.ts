import { getSafeReturnPath } from '@/shared/lib/getSafeReturnPath'
import { ApiError } from './apiError'

const DEFAULT_ERROR_MESSAGE = '요청에 실패했습니다.'
const NO_CONTENT_STATUS = 204
const RESET_CONTENT_STATUS = 205

type Navigation = (url: string) => void

let navigateToLogin: Navigation = (url) => {
  window.location.assign(url)
}
let hasStartedExpiryNavigation = false

function isErrorResponse(body: unknown): body is { message?: string } {
  return typeof body === 'object' && body !== null && 'message' in body
}

async function getErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null)

  if (isErrorResponse(body) && typeof body.message === 'string') {
    return body.message
  }

  return DEFAULT_ERROR_MESSAGE
}

function getExpiryLoginUrl(): string {
  const currentPath = `${window.location.pathname}${window.location.search}`
  const returnTo = getSafeReturnPath(currentPath)

  return `/login?reason=expired&returnTo=${encodeURIComponent(returnTo)}`
}

function navigateForExpiredSession(): void {
  if (hasStartedExpiryNavigation) {
    return
  }

  hasStartedExpiryNavigation = true

  try {
    navigateToLogin(getExpiryLoginUrl())
  } catch {
    hasStartedExpiryNavigation = false
  }
}

/** 테스트에서 브라우저 리다이렉트를 관찰할 수 있도록 탐색 함수를 일시 교체한다. */
export function setProtectedRequestNavigationForTest(
  navigation: Navigation,
): () => void {
  const previousNavigation = navigateToLogin
  navigateToLogin = navigation

  return () => {
    navigateToLogin = previousNavigation
    hasStartedExpiryNavigation = false
  }
}

export async function requestProtectedJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init)

  if (
    response.status === NO_CONTENT_STATUS ||
    response.status === RESET_CONTENT_STATUS
  ) {
    return undefined as T
  }

  if (!response.ok) {
    const message = await getErrorMessage(response)
    const error = new ApiError(response.status, message)

    if (response.status === 401) {
      navigateForExpiredSession()
    }

    throw error
  }

  return response.json() as Promise<T>
}
