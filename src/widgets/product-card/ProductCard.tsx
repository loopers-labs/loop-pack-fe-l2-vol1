// [AI] 상품 카드 조합 지점(widget). entity 표현 + features 행위 버튼을 여기서 합친다.
// 상위(widget)가 하위(entity + features)를 모두 아는 유일한 곳.
import type { Product } from '@/entities/product/model';
import { ProductCard as ProductCardView } from '@/entities/product/ui/ProductCard';
import { CartButton } from '@/features/add-to-cart/ui/CartButton';
import { WishlistButton } from '@/features/toggle-wishlist/ui/WishlistButton';

export const ProductCard = ({ product }: { product: Product }) => (
  <ProductCardView
    product={product}
    actions={
      <>
        <WishlistButton product={product} />
        <CartButton product={product} />
      </>
    }
  />
);
