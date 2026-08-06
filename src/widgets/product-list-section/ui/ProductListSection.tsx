import type { ReactNode } from 'react';
import type { Product } from '@/entities/product/model/product';
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { ToggleWishlistButton } from '@/features/toggle-wishlist/ui/ToggleWishlistButton';
import { AddToCartButton } from '@/features/add-to-cart/ui/AddToCartButton';

/** 데스크톱 그리드 열 수(5열)와 맞춘 값 — 이보다 앞선 카드는 뷰포트 진입 전에도 즉시 로드한다 */
const ABOVE_FOLD_COUNT = 5;

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
  /** 기존 목록을 유지한 채 갱신 중이면 true — 목록을 비우지 않고 aria-busy + pending 오버레이로 신호를 준다 */
  isUpdating?: boolean;
};

/* AI-generated : week06-fsd.md 4단계 기준 — 텍스트 슬롯 + 그리드(ProductCard+features 조합) 위젯. 이름 변경(Body → ProductListSection)은 RFC 애매한 파일 결정표 참고 */
/* AI-generated : Week 7 Part 2 — 갱신 중(isFetching)에도 화면에 아무 신호가 없던 gap을 메움. isUpdating이면 레이아웃 크기는 그대로 두고 기존 목록 위에 pending 오버레이(z-index)를 띄운다 — opacity로 전체를 흐릿하게 만드는 대신, 별도 레이어로 "갱신 중"임을 명확히 알린다 */
export function ProductListSection({
  children,
  products,
  emptyMessage,
  labelPrefix,
  sectionLabel,
  isUpdating = false,
}: ProductListSectionProps) {
  return (
    <section className="week05-section" aria-label={sectionLabel} aria-busy={isUpdating}>
      {isUpdating && (
        <div className="week05-section__pending-overlay" aria-hidden="true">
          <p>목록 갱신 중…</p>
        </div>
      )}
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
              <ProductCard
                key={product.id}
                product={product}
                isAboveFold={index < ABOVE_FOLD_COUNT}
              >
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
