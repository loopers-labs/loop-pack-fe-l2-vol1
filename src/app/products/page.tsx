import { Suspense } from "react";
import { type SearchParams } from "nuqs/server";
import {
  ProductListSection,
  ProductListSkeleton,
  generateProductListMetadata,
} from "@/_pages/products";

export const generateMetadata = generateProductListMetadata;

export default function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    // 스트리밍 경계 — 목록 prefetch(ProductListSection 의 await)를 여기서 잡아 HTML 껍데기를 먼저 내려주기 위해 Suspense사용.
    // (CSR bailout 격리와는 무관: 이 라우트가 정적 프리렌더될 때 useSearchParams 를 감싸주는 건
    //  layout 의 Suspense 쪽이고, 이 경계를 지워도 빌드 에러는 나지 않는다 — 대신 prefetch(await)가
    //  끝날 때까지 첫 응답이 통째로 지연된다(TTFB).)
    // cold 최초 진입에서 이 SSR fallback 이 먼저 뜨므로, 실제 카드 grid 를 미러한 스켈레톤으로 공간을 예약한다.
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductListSection searchParams={searchParams} />
    </Suspense>
  );
}
