import Image from 'next/image'
import { formatWon } from '@/lib/formatWon'
import type { Product } from '@/types/commerce'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
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
    </article>
  )
}
