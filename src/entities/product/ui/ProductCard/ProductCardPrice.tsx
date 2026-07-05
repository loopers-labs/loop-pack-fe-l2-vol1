import { Show } from '@ilokesto/utilinent'

import type { Product } from '../../model'

type ProductCardPriceProps = {
  readonly product: Product
}

export function ProductCardPrice({ product }: ProductCardPriceProps) {
  const formattedOriginal = product.originalPrice
    ? formatProductPrice(product.originalPrice)
    : null
  const formattedPrice = formatProductPrice(product.price)
  const isFreeShipping = product.price >= 50000

  return (
    <div className="mb-1.5 flex flex-col gap-0.5">
      <Show when={formattedOriginal}>
        <span className="text-xs text-[#999] line-through">
          {formattedOriginal}
        </span>
      </Show>
      <span className="text-base font-bold text-[#111]">{formattedPrice}</span>
      <Show when={isFreeShipping}>
        <span className="ml-1.5 text-[11px] font-semibold text-[#2e7d32]">
          무료배송
        </span>
      </Show>
    </div>
  )
}

function formatProductPrice(price: number) {
  return `${price.toLocaleString()}원`
}
