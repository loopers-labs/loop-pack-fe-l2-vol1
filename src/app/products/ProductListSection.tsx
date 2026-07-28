import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createLoader, type SearchParams } from "nuqs/server";
import { ProductList } from "@/components/commerce/ProductList";
import {
  productListParsers,
  resolveProductListQuery,
} from "@/hooks/productListSearchParams";
import { getQueryClient } from "@/lib/queryClient";
import { productQueries } from "@/queries/products";

const loadProductListParams = createLoader(productListParsers);

// async 서버 컴포넌트: 목록 prefetch await 를 page 가 아니라 Suspense 경계 '안'에서 수행한다.
// 그래야 page 함수가 데이터에 막히지 않고 즉시 return → layout 의 헤더·필터 shell 이 먼저 스트리밍되고,
// 목록은 준비되는 대로 이 경계의 구멍으로 흘러나간다(TTFB 가 prefetch 에 붙잡히지 않음).
export async function ProductListSection({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = resolveProductListQuery(
    await loadProductListParams(searchParams),
  );

  // 요청마다 새 QueryClient 로, 클라와 "같은" 쿼리 팩토리를 prefetch 한다 → 같은 queryKey 로 캐시가 채워진다.
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(productQueries.list(query));

  return (
    // dehydrate 로 서버 캐시를 클라에 넘긴다 → ProductList 의 useQuery 가 mount 시 재요청 없이 hit
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductList />
    </HydrationBoundary>
  );
}
