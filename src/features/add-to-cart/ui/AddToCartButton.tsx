'use client'

import { useLayoutEffect, useRef, type JSX } from 'react'
import { trackCartAdd } from '@/analytics/events'
import { useIsInCart, useToggleCart } from '@/entities/cart'

interface AddToCartButtonProps {
  productId: string
  productName: string
}

export function AddToCartButton({
  productId,
  productName,
}: AddToCartButtonProps): JSX.Element {
  const inCart = useIsInCart(productId)
  const currentInCart = useRef(inCart)
  const toggleCart = useToggleCart()

  useLayoutEffect(() => {
    currentInCart.current = inCart
  }, [inCart])

  const handleClick = (): void => {
    const wasInCart = currentInCart.current

    toggleCart(productId)
    currentInCart.current = !wasInCart

    if (!wasInCart) {
      trackCartAdd({ productId, quantity: 1 })
    }
  }

  return (
    <button
      type="button"
      aria-label={`${productName} 장바구니`}
      aria-pressed={inCart}
      onClick={handleClick}
    >
      {inCart ? '담김' : '담기'}
    </button>
  )
}
