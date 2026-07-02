interface PageHeaderProps {
  totalCount: number;
  wishlistCount: number;
}

export function PageHeader({ totalCount, wishlistCount }: PageHeaderProps) {
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
