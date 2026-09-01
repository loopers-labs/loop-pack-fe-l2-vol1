import { describe, expect, it } from 'vitest'

import { AuthRedirect } from './AuthRedirect'

describe('AuthRedirect protected path policy', () => {
  it.each(['/checkout', '/checkout/review', '/orders', '/orders/o1'])(
    'accepts the protected path %s',
    (pathname) => {
      expect(AuthRedirect.isProtectedPath(pathname)).toBe(true)
    },
  )

  it.each([
    '/',
    '/products',
    '/login',
    '/order',
    '/orders-malicious',
    '/checkout-malicious',
  ])('rejects the public or lookalike path %s', (pathname) => {
    expect(AuthRedirect.isProtectedPath(pathname)).toBe(false)
  })
})

describe('AuthRedirect next parameter policy', () => {
  it.each([
    ['/orders', '/orders'],
    ['/orders/o1', '/orders/o1'],
    ['/checkout?coupon=welcome', '/checkout?coupon=welcome'],
    ['/orders?status=open&status=closed', '/orders?status=open&status=closed'],
    ['/checkout#payment', '/checkout'],
  ])('keeps the safe return path %s', (raw, expected) => {
    expect(AuthRedirect.resolveNext(raw)).toBe(expected)
  })

  it.each([
    undefined,
    [],
    ['/orders'],
    '',
    'https://evil.example/orders',
    '//evil.example/orders',
    String.raw`\evil.example\orders`,
    '/products',
    '/login',
    '/orders-malicious',
    '/checkout-malicious',
    '/orders/%2e%2e/products',
  ])('falls back to home for unsafe value %j', (raw) => {
    expect(AuthRedirect.resolveNext(raw)).toBe('/')
  })

  it('encodes the validated return path in the login URL', () => {
    expect(AuthRedirect.toLoginPath('/orders?status=open')).toBe(
      '/login?next=%2Forders%3Fstatus%3Dopen',
    )
  })
})
