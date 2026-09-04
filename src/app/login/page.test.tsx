import { describe, expect, it } from 'vitest'
import Page from './page'

describe('/login route boundary', () => {
  it('passes single string search params to the login page UI', async () => {
    const element = await Page({
      searchParams: Promise.resolve({
        reason: 'expired',
        returnTo: '/checkout',
      }),
    })

    expect(element.props).toMatchObject({
      reason: 'expired',
      returnTo: '/checkout',
    })
  })

  it('does not pass array search params to the login page UI', async () => {
    const element = await Page({
      searchParams: Promise.resolve({
        reason: ['expired', 'other'],
        returnTo: ['/checkout', '/orders'],
      }),
    })

    expect(element.props).toMatchObject({
      reason: undefined,
      returnTo: undefined,
    })
  })
})
