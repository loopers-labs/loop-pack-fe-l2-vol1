import { ROUTES } from '@/shared/config/routes'

/* 로그인 URL의 파라미터 계약을 한 곳에서 관리하고, returnUrl 안전성은 받는 쪽에서 검증한다. */
export const LOGIN_QUERY_PARAMS = {
  RETURN_URL: 'returnUrl',
  ENTRY_POINT: 'entryPoint',
  PRODUCT_ID: 'productId',
  REASON: 'reason',
} as const

export const LOGIN_REASON = {
  SESSION_EXPIRED: 'session_expired',
} as const

export type LoginReason = (typeof LOGIN_REASON)[keyof typeof LOGIN_REASON]

export const isLoginReason = (value: unknown): value is LoginReason =>
  value === LOGIN_REASON.SESSION_EXPIRED

type LoginPathContext = {
  entryPoint?: string
  productId?: string
  reason?: LoginReason
}

export const toLoginPath = (returnPath: string, context: LoginPathContext = {}): string => {
  const params = new URLSearchParams({ [LOGIN_QUERY_PARAMS.RETURN_URL]: returnPath })

  if (context.entryPoint !== undefined) {
    params.set(LOGIN_QUERY_PARAMS.ENTRY_POINT, context.entryPoint)
  }
  if (context.productId !== undefined) {
    params.set(LOGIN_QUERY_PARAMS.PRODUCT_ID, context.productId)
  }
  if (context.reason !== undefined) {
    params.set(LOGIN_QUERY_PARAMS.REASON, context.reason)
  }

  return `${ROUTES.LOGIN}?${params.toString()}`
}
