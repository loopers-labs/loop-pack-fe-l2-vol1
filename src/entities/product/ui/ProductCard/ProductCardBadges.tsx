import { Show } from '@ilokesto/utilinent'
import { tv } from 'tailwind-variants'

import type { Product } from '../../model'

type ProductCardBadgesProps = {
  readonly product: Product
}

const productBadge = tv({
  base: 'absolute rounded px-2 py-1 text-[11px] font-semibold text-white',
  variants: {
    variant: {
      almostSoldOut: 'bottom-2 left-2 bg-[#fb8c00]',
      best: 'top-9 right-2 bg-[#6a1b9a]',
      discount: 'top-2 left-2 bg-[#e53935]',
      hot: 'top-9 left-2 bg-[#d81b60]',
      newProduct: 'top-2 right-2 bg-[#1e88e5]',
      soldOut: 'bottom-2 left-2 bg-[#555]',
    },
  },
})

export function ProductCardBadges({ product }: ProductCardBadgesProps) {
  const discountRate = getDiscountRate(product)
  const isAlmostSoldOut = product.stock > 0 && product.stock <= 5
  const isSoldOut = product.stock === 0
  const isHot = discountRate >= 30
  const isBest = product.rating >= 4.5 && product.reviewCount >= 100
  const isNew = getDaysSinceCreated(product.createdAt) <= 7

  return (
    <>
      <Show when={discountRate > 0}>
        <span className={productBadge({ variant: 'discount' })}>
          {discountRate}% 할인
        </span>
      </Show>
      <Show when={isNew}>
        <span className={productBadge({ variant: 'newProduct' })}>NEW</span>
      </Show>
      <Show when={isHot}>
        <span className={productBadge({ variant: 'hot' })}>특가</span>
      </Show>
      <Show when={isBest}>
        <span className={productBadge({ variant: 'best' })}>BEST</span>
      </Show>
      <Show when={isSoldOut}>
        <span className={productBadge({ variant: 'soldOut' })}>품절</span>
      </Show>
      <Show when={!isSoldOut && isAlmostSoldOut}>
        <span className={productBadge({ variant: 'almostSoldOut' })}>
          품절 임박
        </span>
      </Show>
    </>
  )
}

function getDiscountRate(product: Product) {
  return product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0
}

function getDaysSinceCreated(createdAt: Product['createdAt']) {
  const createdDate = new Date(createdAt)
  const now = new Date()

  return Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
  )
}
