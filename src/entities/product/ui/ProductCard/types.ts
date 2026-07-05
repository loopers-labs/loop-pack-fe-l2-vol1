import type { ReactNode } from 'react'

import type { Product } from '../../model'

export type ProductCardProps = {
  readonly action?: ReactNode
  readonly clickAriaLabel: string
  readonly highlightQuery: string
  readonly onClick: (productId: Product['id']) => void
  readonly product: Product
}
