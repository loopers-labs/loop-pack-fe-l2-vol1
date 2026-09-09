import '@/analytics/client'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { registerProviders } from '@/analytics/logger'
import { useCartStore } from '@/entities/cart/model/CartStore'

import { AddToCartButton } from './AddToCartButton'

type CapturedTrack = {
  readonly type: 'track'
  readonly event: string
  readonly properties: Record<string, unknown>
}

const calls: Array<CapturedTrack> = []

registerProviders([
  {
    name: 'capture',
    initialize() {},
    track: (event, properties) => {
      calls.push({ type: 'track', event, properties })
    },
    identify() {},
    reset() {},
  },
])

const tracked = (event: string) => calls.filter((call) => call.event === event)

beforeEach(() => {
  calls.length = 0
  useCartStore.setState({ items: {} })
})

describe('AddToCartButton instrumentation', () => {
  it('emits cart_add only on the absent-to-present transition', async () => {
    const user = userEvent.setup()
    render(<AddToCartButton productId="p1" productName="테스트 상품" />)

    await user.click(
      screen.getByRole('button', { name: '테스트 상품 장바구니' }),
    )

    expect(tracked('cart_add')).toHaveLength(1)
    expect(tracked('cart_add')[0].properties.productId).toBe('p1')

    await user.click(
      screen.getByRole('button', { name: '테스트 상품 장바구니' }),
    )

    expect(tracked('cart_add')).toHaveLength(1)
  })
})
