// [AI] 상품 목록 pending UI.
// ProductCard(entities/product/ui/ProductCard.tsx)와 같은 .product/.image 레이아웃을 써서
// 진짜 카드로 교체될 때 카드 전체 높이가 같고, 아래 콘텐츠(페이지네이션 등)가 밀리지 않는다(CLS 방지).
// 빈 줄 구조도 실제 카드의 image → brand → name → price → 액션 버튼 순서를 그대로 모방한다.
export const SkeletonCard = () => {
  return (
    <article className="product" aria-hidden="true">
      <div className="image skeleton" />
      <div className="skeleton skeleton-text skeleton-text--brand" />
      <div className="skeleton skeleton-text skeleton-text--name" />
      <div className="skeleton skeleton-text skeleton-text--price" />
      <div>
        <div className="skeleton skeleton-action" />
        <div className="skeleton skeleton-action" />
      </div>
    </article>
  );
};
