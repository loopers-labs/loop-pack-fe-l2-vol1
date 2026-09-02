import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { config, proxy } from '../proxy'

const requestFor = (path: string, session?: string): NextRequest => {
  const request = new NextRequest(`http://localhost${path}`)

  if (session !== undefined) {
    request.cookies.set('session', session)
  }

  return request
}

describe('proxy', () => {
  it('redirects an unauthenticated checkout request with its encoded internal path', () => {
    const response = proxy(requestFor('/checkout?coupon=welcome'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost/login?returnTo=%2Fcheckout%3Fcoupon%3Dwelcome',
    )
  })

  it('redirects an unauthenticated orders request', () => {
    const response = proxy(requestFor('/orders'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost/login?returnTo=%2Forders',
    )
  })

  it('passes through when any session cookie is present', () => {
    const response = proxy(requestFor('/checkout', 'not-a-verified-token'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('leaves products unchanged when called directly', () => {
    const response = proxy(requestFor('/products'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('matches only the protected path groups', () => {
    expect(config.matcher).toEqual(['/checkout/:path*', '/orders/:path*'])
  })
})
