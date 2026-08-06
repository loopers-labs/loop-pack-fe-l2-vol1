import { DEFAULT_PAGE_SIZE } from "@/features/products/model/pagination";
import { ProductGridSkeleton } from "@/features/products/ui/ProductSkeleton";
import { Skeleton } from "@/shared/ui/loading/Skeleton";

// /products 진입 시 서버 프리패치가 끝날 때까지 route-level Suspense fallback으로 뜬다.
// 데이터 없는 최초 진입의 pending UI다. 실제 화면과 같은 구조·공간을 잡아 교체 시 레이아웃이 흔들리지 않게 한다.
// fallback이라 URL의 pageSize를 모르므로 기본 개수로 그린다.
export default function Loading() {
  return (
    <>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <div className="week05-filters" aria-hidden="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-16" />
        </div>
      </section>

      <section className="week05-section" aria-busy="true">
        <ProductGridSkeleton count={DEFAULT_PAGE_SIZE} />
      </section>
    </>
  );
}
