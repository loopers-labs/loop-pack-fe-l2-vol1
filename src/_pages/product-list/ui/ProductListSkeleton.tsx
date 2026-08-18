// 데이터가 없는 최초 진입에서만 쓴다.
// 카드 수와 모양을 실제 목록과 같게 두어, 교체될 때 아래 콘텐츠가 밀리지 않는다.
const PLACEHOLDER_CARDS = Array.from({ length: 12 }, (_, index) => index);

export function ProductListSkeleton() {
  return (
    <div className="shop-grid" aria-hidden="true">
      {PLACEHOLDER_CARDS.map((index) => (
        <article key={index} className="shop-product shop-product-skeleton">
          <div className="shop-image shop-skeleton-block" />
          <p className="shop-skeleton-line shop-skeleton-line-short" />
          <p className="shop-skeleton-line" />
          <p className="shop-skeleton-line shop-skeleton-line-short" />
        </article>
      ))}
    </div>
  );
}
