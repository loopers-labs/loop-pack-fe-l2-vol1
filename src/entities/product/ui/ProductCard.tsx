import Image from 'next/image'
import type { ReactNode } from 'react'

import type { Product } from '@/entities/product/model/types'

type ProductCardProps = {
  readonly product: Product
  readonly priority?: boolean
  readonly actions?: ReactNode
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`

export function ProductCard({
  product,
  priority = false,
  actions,
}: ProductCardProps) {
  const discountRate =
    product.originalPrice !== null
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null

  return (
    <article className="flex flex-col gap-2">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-(--color-surface-soft)">
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 480px) 50vw, (max-width: 960px) 33vw, 20vw"
          className="object-cover"
        />
      </div>
      <p className="text-xs text-(--color-subtle)">{product.brand}</p>
      <h3 className="line-clamp-2 text-sm leading-snug text-(--color-text)">
        {product.name}
      </h3>
      <div className="flex items-baseline gap-2">
        <strong className="text-base font-bold text-(--color-ink)">
          {formatPrice(product.price)}
        </strong>
        {product.originalPrice !== null && discountRate !== null && (
          <>
            <span className="text-xs text-(--color-subtle) line-through">
              {formatPrice(product.originalPrice)}
            </span>
            <span className="text-xs font-semibold text-red-500">
              {String(discountRate)}%
            </span>
          </>
        )}
      </div>
      <div className="flex gap-2">{actions}</div>
    </article>
  )
}
