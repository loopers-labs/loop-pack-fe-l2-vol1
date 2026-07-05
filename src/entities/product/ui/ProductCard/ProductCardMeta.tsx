import type { ReactNode } from 'react'

import type { Product } from '../../model'

type ProductCardMetaProps = {
  readonly action?: ReactNode
  readonly product: Product
}

export function ProductCardMeta({ action, product }: ProductCardMetaProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-[#666]">
      <span className="font-semibold text-[#f9a825]">
        ★ {product.rating.toFixed(1)}
      </span>
      <span>({product.reviewCount.toLocaleString()})</span>
      {action}
    </div>
  )
}
