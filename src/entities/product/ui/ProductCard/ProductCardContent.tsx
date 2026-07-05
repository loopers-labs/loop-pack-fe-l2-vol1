import type { ReactNode } from 'react'

import type { Product } from '../../model'
import { ProductCardMeta } from './ProductCardMeta'
import { ProductCardPrice } from './ProductCardPrice'
import { ProductCardTitle } from './ProductCardTitle'

type ProductCardContentProps = {
  readonly action?: ReactNode
  readonly highlightQuery: string
  readonly product: Product
}

export function ProductCardContent({
  action,
  highlightQuery,
  product,
}: ProductCardContentProps) {
  return (
    <div className="p-3">
      <ProductCardTitle highlightQuery={highlightQuery} title={product.name} />
      <ProductCardPrice product={product} />
      <ProductCardMeta action={action} product={product} />
    </div>
  )
}
