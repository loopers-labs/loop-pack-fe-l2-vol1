import { ApiError } from '@/shared/api/apiError'
import { getSafeReturnPath } from '@/shared/lib/getSafeReturnPath'
import { ensureClientAnalyticsConfigured } from './client'
import { identify, reset, track } from './logger'

export type LoginSource = 'cart' | 'orders' | 'direct'

export type LoginFailureReason =
  'INVALID_REQUEST' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR' | 'UNKNOWN'

export interface ProductListViewEvent {
  category: string
  sort: string
  page: number
}

export interface CartAddEvent {
  productId: string
  quantity: number
}

export interface LoginEvent {
  from: LoginSource
}

export interface LoginFailEvent {
  reason: LoginFailureReason
  status: number | null
}

export interface OrderStartEvent {
  productIds: readonly string[]
  itemCount: number
}

export interface OrderCompleteEvent extends OrderStartEvent {
  orderId: string
}

export interface LoginFailure {
  reason: LoginFailureReason
  status: number | null
}

export function trackProductListView({
  category,
  sort,
  page,
}: ProductListViewEvent): void {
  ensureClientAnalyticsConfigured()
  track('product_list_view', { category, sort, page })
}

export function trackCartAdd({ productId, quantity }: CartAddEvent): void {
  ensureClientAnalyticsConfigured()
  track('cart_add', { productId, quantity })
}

export function trackLoginStart({ from }: LoginEvent): void {
  ensureClientAnalyticsConfigured()
  track('login_start', { from })
}

export function trackLoginSuccess({ from }: LoginEvent): void {
  ensureClientAnalyticsConfigured()
  track('login_success', { from })
}

export function trackLoginFail({ reason, status }: LoginFailEvent): void {
  ensureClientAnalyticsConfigured()
  track('login_fail', { reason, status })
}

export function trackOrderStart({
  productIds,
  itemCount,
}: OrderStartEvent): void {
  ensureClientAnalyticsConfigured()
  track('order_start', { productIds: [...productIds], itemCount })
}

export function trackOrderComplete({
  orderId,
  productIds,
  itemCount,
}: OrderCompleteEvent): void {
  ensureClientAnalyticsConfigured()
  track('order_complete', { orderId, productIds: [...productIds], itemCount })
}

export function identifyUser(userId: string): void {
  ensureClientAnalyticsConfigured()
  identify(userId)
}

export function resetUser(): void {
  ensureClientAnalyticsConfigured()
  reset()
}

export function getLoginSource(
  returnTo: string | null | undefined,
): LoginSource {
  const safeReturnPath = getSafeReturnPath(returnTo)

  if (matchesRoute(safeReturnPath, '/checkout')) {
    return 'cart'
  }

  if (matchesRoute(safeReturnPath, '/orders')) {
    return 'orders'
  }

  return 'direct'
}

export function getLoginFailure(error: unknown): LoginFailure {
  if (!(error instanceof ApiError)) {
    return { reason: 'UNKNOWN', status: null }
  }

  if (error.status === 400) {
    return { reason: 'INVALID_REQUEST', status: error.status }
  }

  if (error.status === 401) {
    return { reason: 'INVALID_CREDENTIALS', status: error.status }
  }

  if (error.status >= 500) {
    return { reason: 'SERVER_ERROR', status: error.status }
  }

  return { reason: 'UNKNOWN', status: error.status }
}

function matchesRoute(returnTo: string, route: string): boolean {
  return (
    returnTo === route ||
    returnTo.startsWith(`${route}/`) ||
    returnTo.startsWith(`${route}?`) ||
    returnTo.startsWith(`${route}#`)
  )
}
