import { Suspense } from 'react';

import { ProductListPage } from '@/_pages/product-list/ui/ProductListPage';

/**
 * 상품 목록 (`/products`).
 * 조건의 원본이 URL(nuqs)이므로 목록 데이터는 클라이언트에서 조회한다.
 *
 * 바깥 Suspense: nuqs가 쓰는 useSearchParams는 정적 프리렌더 시 Suspense 경계를 요구한다(빌드 요건) /
 *   런타임(하이드레이션 후)에는 ProductListPage가 suspend하지 않아 이 fallback은 뜨지 않는다.
 * 필터 변경 시 로딩은 ProductListPage 내부의 결과 전용 경계만 처리하므로 필터 폼은 유지된다.
 */
export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="week05-section">상품을 준비하고 있습니다…</p>}>
      <ProductListPage />
    </Suspense>
  );
}
