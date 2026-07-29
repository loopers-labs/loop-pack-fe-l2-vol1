import CartToggleButton from '@/entities/cart/ui/CartToggleButton'
import type { Product } from '@/entities/product/model/product'
import ProductCard from '@/entities/product/ui/ProductCard'
import WishlistToggleButton from '@/entities/wishlist/ui/WishlistToggleButton'

interface ProductGridProps {
  products: Product[]
}

// 상품 표현과 두 행위를 붙이는 조합 규칙을 소유한다. 세 entity가 여기서 만나며,
// 어느 entity도 다른 entity를 알지 않는다. 조합은 상위의 책임이라는 규칙이 지켜지는 자리다.
//
// 이 widget이 고정하는 것은 그리드 레이아웃, 행위의 순서, 두 행위가 항상 함께 붙는다는
// 정책이다. 빈 상태와 총 개수와 페이지네이션은 화면마다 달라서 page가 소유한다.
// 그래서 이 컴포넌트는 비어 있지 않은 목록만 받는다.
export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="week05-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          actions={
            <>
              <WishlistToggleButton
                productId={product.id}
                productName={product.name}
              />
              <CartToggleButton
                productId={product.id}
                productName={product.name}
              />
            </>
          }
        />
      ))}
    </div>
  )
}
