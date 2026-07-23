'use client'

import Image from 'next/image'
import { formatWon } from '@/lib/formatWon'
import { useShoppingStore } from '@/stores/shopping'
import type { Product } from '@/types/commerce'

interface ProductCardProps {
  product: Product
}

// 카드는 자기 상품의 포함 여부(boolean)와 action만 구독한다.
// 다른 상품을 토글해도 이 카드는 리렌더되지 않는다.
export default function ProductCard({ product }: ProductCardProps) {
  const isInWishlist = useShoppingStore((state) =>
    state.wishlistIds.includes(product.id),
  )
  const isInCart = useShoppingStore((state) =>
    state.cartIds.includes(product.id),
  )
  const toggleWishlist = useShoppingStore((state) => state.toggleWishlist)
  const toggleCart = useShoppingStore((state) => state.toggleCart)

  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>{formatWon(product.price)}</strong>
      <div>
        <button
          type="button"
          aria-label={`${product.name} 위시리스트`}
          aria-pressed={isInWishlist}
          onClick={() => toggleWishlist(product.id)}
        >
          {isInWishlist ? '찜 해제' : '찜'}
        </button>
        <button
          type="button"
          aria-label={`${product.name} 장바구니`}
          aria-pressed={isInCart}
          onClick={() => toggleCart(product.id)}
        >
          {isInCart ? '빼기' : '담기'}
        </button>
      </div>
    </article>
  )
}
