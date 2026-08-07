import { Suspense } from "react";
import { ProductListPage } from "@/_pages/product-list/ui/ProductListPage";

// nuqs(useSearchParams 기반)는 Suspense 경계가 필요하다.
// 이 fallback은 "URL 조건을 아직 못 읽음"을 뜻하고, Query의 isPending("서버 응답 대기")과 범위가 다르다.
export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="shop-page">
          <p className="shop-state">상품 목록을 준비하는 중입니다…</p>
        </main>
      }
    >
      <ProductListPage />
    </Suspense>
  );
}
