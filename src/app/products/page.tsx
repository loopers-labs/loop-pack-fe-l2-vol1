import { Suspense } from "react";
import { ProductsView } from "./ProductsView";

// nuqs(useSearchParams 기반)는 Suspense 경계가 필요하다. 실제 화면은 client에.
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="shop-page">
          <p className="shop-state">상품 목록을 준비하는 중입니다…</p>
        </main>
      }
    >
      <ProductsView />
    </Suspense>
  );
}
