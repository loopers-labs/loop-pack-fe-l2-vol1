import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/apiError'
import { ensureClientAnalyticsConfigured } from './client'
import {
  getLoginFailure,
  getLoginSource,
  identifyUser,
  resetUser,
  trackCartAdd,
  trackLoginFail,
  trackLoginStart,
  trackLoginSuccess,
  trackOrderComplete,
  trackOrderStart,
  trackProductListView,
} from './events'
import { identify, reset, track } from './logger'

vi.mock('./client', () => ({
  ensureClientAnalyticsConfigured: vi.fn(),
}))

vi.mock('./logger', () => ({
  identify: vi.fn(),
  reset: vi.fn(),
  track: vi.fn(),
}))

describe('analytics events', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('tracks a product list view with its exact event contract', () => {
    trackProductListView({ category: 'fashion', sort: 'price-desc', page: 2 })

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledWith('product_list_view', {
      category: 'fashion',
      sort: 'price-desc',
      page: 2,
    })
  })

  it('tracks a cart add with its exact event contract', () => {
    trackCartAdd({ productId: 'p1', quantity: 1 })

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledWith('cart_add', {
      productId: 'p1',
      quantity: 1,
    })
  })

  it('tracks a login start with its exact event contract', () => {
    trackLoginStart({ from: 'cart' })

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledWith('login_start', { from: 'cart' })
  })

  it('tracks a login success with its exact event contract', () => {
    trackLoginSuccess({ from: 'orders' })

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledWith('login_success', { from: 'orders' })
  })

  it('tracks a normalized login failure with its exact event contract', () => {
    trackLoginFail({ reason: 'INVALID_CREDENTIALS', status: 401 })

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledWith('login_fail', {
      reason: 'INVALID_CREDENTIALS',
      status: 401,
    })
  })

  it('tracks an order start with its exact event contract', () => {
    trackOrderStart({ productIds: ['p1', 'p2'], itemCount: 2 })

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledWith('order_start', {
      productIds: ['p1', 'p2'],
      itemCount: 2,
    })
  })

  it('tracks an order completion with its exact event contract', () => {
    trackOrderComplete({
      orderId: 'o1',
      productIds: ['p1', 'p2'],
      itemCount: 2,
    })

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledWith('order_complete', {
      orderId: 'o1',
      productIds: ['p1', 'p2'],
      itemCount: 2,
    })
  })

  it('snapshots order product IDs before callers can mutate them', () => {
    const productIds = ['p1', 'p2']

    trackOrderStart({ productIds, itemCount: 2 })
    productIds.push('p3')

    expect(track).toHaveBeenCalledWith('order_start', {
      productIds: ['p1', 'p2'],
      itemCount: 2,
    })
  })

  it('identifies a user through the configured logger boundary', () => {
    identifyUser('u1')

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(identify).toHaveBeenCalledOnce()
    expect(identify).toHaveBeenCalledWith('u1')
  })

  it('resets a user through the configured logger boundary', () => {
    resetUser()

    expect(ensureClientAnalyticsConfigured).toHaveBeenCalledOnce()
    expect(reset).toHaveBeenCalledOnce()
    expect(reset).toHaveBeenCalledWith()
  })

  it.each([
    ['/checkout?coupon=welcome', 'cart'],
    ['/orders?page=2', 'orders'],
    ['https://evil.example/checkout', 'direct'],
    ['//evil.example/orders', 'direct'],
    [undefined, 'direct'],
  ] as const)('classifies %s as the %s login source', (returnTo, expected) => {
    expect(getLoginSource(returnTo)).toBe(expected)
  })

  it.each([
    [new ApiError(400, 'email must not be logged'), 'INVALID_REQUEST', 400],
    [
      new ApiError(401, 'password must not be logged'),
      'INVALID_CREDENTIALS',
      401,
    ],
    [
      new ApiError(500, 'server detail must not be logged'),
      'SERVER_ERROR',
      500,
    ],
    [new ApiError(499, 'client detail must not be logged'), 'UNKNOWN', 499],
    [new Error('network detail must not be logged'), 'UNKNOWN', null],
    [{ email: 'person@example.com' }, 'UNKNOWN', null],
  ] as const)(
    'normalizes login failure without exposing error detail',
    (error, reason, status) => {
      expect(getLoginFailure(error)).toEqual({ reason, status })
    },
  )
})
