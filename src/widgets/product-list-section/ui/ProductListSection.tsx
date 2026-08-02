import type { ReactNode } from 'react';
import type { Product } from '@/entities/product/model/product';
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { ToggleWishlistButton } from '@/features/toggle-wishlist/ui/ToggleWishlistButton';
import { AddToCartButton } from '@/features/add-to-cart/ui/AddToCartButton';

type ProductListSectionProps = {
  /** 텍스트 영역(제목 또는 총 개수 등). 화면마다 다른 내용이라 이 컴포넌트는 내용을 모르게 슬롯으로만 받는다 */
  children: ReactNode;
  /** 그리드에 나열할 상품 목록 */
  products: Product[];
  /** 상품이 없을 때 보여줄 문구 */
  emptyMessage: string;
  /** 찜/담기 aria-label에 붙일 접두사 (예: "인기 상품"). 없으면 접두사 없이 "1번 상품"만 사용 */
  labelPrefix?: string;
  /** section의 aria-label (선택) */
  sectionLabel?: string;
};

/* AI-generated : week06-fsd.md 4단계 기준 — 텍스트 슬롯 + 그리드(ProductCard+features 조합) 위젯. 이름 변경(Body → ProductListSection)은 RFC 애매한 파일 결정표 참고 */
export function ProductListSection({
  children,
  products,
  emptyMessage,
  labelPrefix,
  sectionLabel,
}: ProductListSectionProps) {
  return (
    <section className="week05-section" aria-label={sectionLabel}>
      {children}
      {products.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div className="week05-grid">
          {products.map((product, index) => {
            const label = labelPrefix
              ? `${labelPrefix} ${index + 1}번 상품`
              : `${index + 1}번 상품`;
            return (
              <ProductCard key={product.id} product={product}>
                <ToggleWishlistButton productId={product.id} label={label} />
                <AddToCartButton productId={product.id} label={label} />
              </ProductCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
