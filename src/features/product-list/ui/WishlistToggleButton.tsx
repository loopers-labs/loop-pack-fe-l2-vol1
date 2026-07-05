import { Show } from '@ilokesto/utilinent'
import type { MouseEvent } from 'react'

import type { Product } from '@/entities/product'

type WishlistToggleButtonProps = {
  readonly isWished: boolean
  readonly onToggle: (productId: Product['id']) => void
  readonly productId: Product['id']
  readonly productName: Product['name']
}

export function WishlistToggleButton({
  isWished,
  onToggle,
  productId,
  productName,
}: WishlistToggleButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onToggle(productId)
  }

  return (
    <Show.button
      when={isWished}
      fallback="♡"
      type="button"
      className="relative z-20 ml-auto cursor-pointer border-0 bg-transparent text-base"
      onClick={handleClick}
      aria-label={`${productName} 위시리스트 ${isWished ? '제거' : '추가'}`}
      aria-pressed={isWished}
    >
      ♥
    </Show.button>
  )
}
