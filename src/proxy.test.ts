import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import nextConfig from '../next.config'
import { SESSION_COOKIE } from './app/api/_data/auth-cookies'
import { config, proxy } from './proxy'

describe('proxy matcher boundary', () => {
  it.each(['/checkout', '/checkout/review', '/orders', '/orders/o1'])(
    'matches the protected path %s',
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig, url })).toBe(
        true,
      )
    },
  )

  it.each(['/', '/products', '/login', '/orders-malicious'])(
    'does not match the public path %s',
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig, url })).toBe(
        false,
      )
    },
  )
})

describe('proxy session cookie gate', () => {
  it('redirects an anonymous request with its protected return path', () => {
    const response = proxy(
      new NextRequest('http://localhost:3000/orders?status=open'),
    )

    expect(response.status).toBe(307)
    expect(getRedirectUrl(response)).toBe(
      'http://localhost:3000/login?next=%2Forders%3Fstatus%3Dopen',
    )
  })

  it('allows a request with a non-empty session cookie', () => {
    const request = new NextRequest('http://localhost:3000/orders')
    request.cookies.set(SESSION_COOKIE, 'signed-or-tampered-token')

    const response = proxy(request)

    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(getRedirectUrl(response)).toBeNull()
  })
})
