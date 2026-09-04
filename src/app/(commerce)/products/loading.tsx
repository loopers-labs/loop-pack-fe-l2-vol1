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
        {/* 실제 필터와 같은 구조·폭으로 그린다 — 라벨(위)+입력(아래) 구조와 컨트롤 폭을 그대로 맞춰
            로드 후 가로·세로 이동이 없게 한다. 폭은 week-05-layout.css의 .week05-filters 고정값과 동일하다
            (검색 200 / select 140 / 초기화 72). 초기화는 실제처럼 입력 바닥에 맞춰 하단 정렬한다. */}
        <div className="week05-filters" aria-hidden="true">
          <label>
            검색
            <Skeleton className="h-10 w-[200px]" />
          </label>
          <label>
            카테고리
            <Skeleton className="h-10 w-[140px]" />
          </label>
          <label>
            정렬
            <Skeleton className="h-10 w-[140px]" />
          </label>
          <label>
            표시 개수
            <Skeleton className="h-10 w-[140px]" />
          </label>
          <Skeleton className="h-10 w-[72px] self-end" />
        </div>
      </section>

      <section className="week05-section" aria-busy="true">
        <ProductGridSkeleton count={DEFAULT_PAGE_SIZE} />
      </section>
    </>
  );
}
