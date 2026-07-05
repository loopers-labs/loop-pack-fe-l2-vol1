import type { Product } from '../../model'
import { ProductCardBadges } from './ProductCardBadges'

type ProductCardMediaProps = {
  readonly product: Product
}

export function ProductCardMedia({ product }: ProductCardMediaProps) {
  return (
    <div className="relative aspect-square bg-[#f0f0f0]">
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        className="block size-full object-cover"
      />
      <ProductCardBadges product={product} />
    </div>
  )
}
