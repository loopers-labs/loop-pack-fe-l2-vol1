import Image from 'next/image'
import ShoppingToggleButtons from '@/components/commerce/ShoppingToggleButtons'
import { formatWon } from '@/lib/formatWon'
import type { Product } from '@/types/commerce'

interface ProductCardProps {
  product: Product
}

// 카드는 상품 표시만 담당한다. 담기와 찜 같은 행위는 버튼 컴포넌트의 몫이라
// store를 알지 못하고, 행위가 늘어도 이 파일은 바뀌지 않는다.
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
      <ShoppingToggleButtons
        productId={product.id}
        productName={product.name}
      />
    </article>
  )
}
