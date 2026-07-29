import Image from 'next/image'
import type { Product } from '@/entities/product/model/product'
import { formatWon } from '@/shared/lib/formatWon'

interface ProductCardProps {
  product: Product
  // 카드에 붙일 사용자 행위를 상위가 넣는다. 카드는 무엇이 들어오는지 알지 않는다.
  actions?: React.ReactNode
}

// 카드는 상품 표현만 담당한다. 담기와 찜을 직접 import하면 도메인 개념 레이어가
// 사용자 행위를 아는 역방향 의존이 된다. 조합은 상위(widget 또는 page)의 책임이다.
export default function ProductCard({ product, actions }: ProductCardProps) {
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
      {actions ? <div>{actions}</div> : null}
    </article>
  )
}
