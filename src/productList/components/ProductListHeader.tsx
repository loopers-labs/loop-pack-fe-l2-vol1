/** 상품 목록 제목과 전체 개수·위시리스트 개수를 보여주는 헤더. */
export default function ProductListHeader({
  totalCount,
  wishlistCount,
}: {
  totalCount: number;
  wishlistCount: number;
}) {
  return (
    <header className="page-header">
      <h1>상품 목록</h1>
      <p className="total-count">
        총 {totalCount.toLocaleString()}개의 상품
        {wishlistCount > 0 && <span> · 위시리스트 {wishlistCount}개</span>}
      </p>
    </header>
  );
}
