import Image from 'next/image'
import { AddCartButton } from '@/features/add-to-cart'
import { WishlistButton } from '@/features/add-to-wishlist'
import { formatPrice } from '@/shared/lib/format-price'
import type { ProductSummary } from '@/entities/product'
import styles from './ProductCard.module.css'

type ProductCardProps = {
  product: ProductSummary
  titleLevel: 2 | 3
}

// 상품 정보와 두 사용자 행위를 조합하는 widget.
// Client 경계는 각 feature 버튼까지 내려가고 이 컴포넌트 자체는 Server Component로 남는다.
export const ProductCard = ({ product, titleLevel }: ProductCardProps) => {
  const ProductTitle = titleLevel === 2 ? 'h2' : 'h3'

  return (
    <article className={styles.card}>
      <Image
        className={styles.image}
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <ProductTitle>{product.name}</ProductTitle>
      <strong>{formatPrice(product.price)}</strong>
      <div className={styles.actions}>
        <WishlistButton product={product} />
        <AddCartButton product={product} />
      </div>
    </article>
  )
}
