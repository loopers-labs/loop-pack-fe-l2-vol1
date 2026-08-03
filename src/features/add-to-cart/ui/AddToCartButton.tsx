'use client'

import { cartSelectors, useCartStore } from '@/entities/cart/model/CartStore'

type AddToCartButtonProps = {
  productId: string
  productName: string
}

export function AddToCartButton({
  productId,
  productName,
}: AddToCartButtonProps) {
  const isInCart = useCartStore(cartSelectors.isInCart(productId))
  const addToCart = useCartStore((state) => state.addToCart)
  const removeFromCart = useCartStore((state) => state.removeFromCart)

  return (
    <button
      type="button"
      aria-pressed={isInCart}
      aria-label={`${productName} 장바구니`}
      onClick={() => {
        if (isInCart) {
          removeFromCart(productId)
        } else {
          addToCart(productId)
        }
      }}
      className="flex-1 rounded border border-(--color-border) px-3 py-2 text-xs text-(--color-text) hover:bg-(--color-surface-muted)"
    >
      {isInCart ? '빼기' : '담기'}
    </button>
  )
}
