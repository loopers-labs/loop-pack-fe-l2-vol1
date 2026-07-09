import { type ReactNode } from 'react';

import type { Product } from '../types';
import type { ViewMode } from './ViewModeToggle';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  viewMode: ViewMode;
  children: ReactNode;
  onRetry: () => void;
}

/**
 * 상품 목록 결과 영역 (로딩/빈 결과/에러 상태 + 그리드 레이아웃)
 * - 분리 기준: 로딩/에러를 Page 전체 early return으로 처리하면 필터·검색창까지 언마운트되어 타이핑 중
 *   포커스를 잃는 버그가 있었습니다. 상태 표현은 실제로 영향을 받는 결과 영역만 담당하도록 분리하였습니다.
 */
const ProductGrid = ({ products, isLoading, error, viewMode, children, onRetry }: ProductGridProps) => {
  if (error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {error.message}</p>
        <button onClick={onRetry}>다시 시도</button>
      </div>
    );
  }

  if (isLoading && products.length === 0) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <>
      <section className="product-grid" style={viewMode === 'list' ? { gridTemplateColumns: '1fr' } : undefined}>
        {products.length === 0 ? <div className="empty">조건에 맞는 상품이 없습니다.</div> : children}
      </section>

      {isLoading && products.length > 0 && <div className="background-loading">데이터 갱신 중...</div>}
    </>
  );
};

export default ProductGrid;
