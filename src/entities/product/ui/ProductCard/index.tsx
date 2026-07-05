import { ProductCardContent } from './ProductCardContent'
import { ProductCardMedia } from './ProductCardMedia'
import type { ProductCardProps } from './types'

export function ProductCard({
  action,
  clickAriaLabel,
  highlightQuery,
  onClick,
  product,
}: ProductCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#eee] bg-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
      <button
        type="button"
        className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
        onClick={() => {
          onClick(product.id)
        }}
        aria-label={clickAriaLabel}
      />
      <ProductCardMedia product={product} />
      <ProductCardContent
        action={action}
        product={product}
        highlightQuery={highlightQuery}
      />
    </div>
  )
}
