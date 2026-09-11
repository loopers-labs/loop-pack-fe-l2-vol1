import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfigError, requireAppOrigin } from "@/shared/config";
import { getQueryClient } from "@/_app/getQueryClient";
import { productListQueryOptions } from "@/_pages/product-list/api/productListQuery";
import { categoryOptions, sortOptions } from "@/_pages/product-list/config/options";
import { resolveProductListQuery } from "@/_pages/product-list/model/resolveProductListQuery";
import { ProductListPage } from "@/_pages/product-list/ui/ProductListPage";
import { commonOpenGraph } from "../../layout";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

// 검색어는 title에 먼저, category·sort는 description에, 2페이지 이상은 title에 페이지 번호.
function buildTitle(query: ReturnType<typeof resolveProductListQuery>, totalCount: number) {
  const head = query.q !== "" ? `"${query.q}" 검색 결과` : "상품 목록";
  const page = query.page > 1 ? ` (${query.page}페이지)` : "";
  return totalCount === 0 ? `${head} — 결과 없음${page}` : `${head}${page}`;
}

function buildDescription(
  query: ReturnType<typeof resolveProductListQuery>,
  totalCount: number,
): string {
  const category = categoryOptions.find((option) => option.id === query.category)?.name ?? "전체";
  const sort = sortOptions.find((option) => option.id === query.sort)?.name ?? "최신순";
  const scope = `카테고리 ${category} · ${sort}`;
  return totalCount === 0
    ? `${scope} 조건에 맞는 상품이 0개입니다.`
    : `${scope} 기준 총 ${totalCount}개의 상품.`;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = resolveProductListQuery(await searchParams);
  const queryClient = getQueryClient();
  try {
    // 본문 prefetch와 같은 정규화·같은 query factory → 같은 GET URL·options.
    const list = await queryClient.fetchQuery(productListQueryOptions(query));
    const title = buildTitle(query, list.totalCount);
    const description = buildDescription(query, list.totalCount);
    // 0건이어도 OG fallback image(루트 공통)를 유지한다.
    const images =
      list.products.length > 0 ? [{ url: list.products[0].image }] : commonOpenGraph.images;
    return {
      title,
      description,
      openGraph: { ...commonOpenGraph, title, description, images },
    };
  } catch (error) {
    // 설정 누락은 삼키지 않는다 — 재시도해도 같고, 삼키면 잘못된 배포가 조용히 산다.
    if (error instanceof ConfigError) {
      throw error;
    }
    return {};
  }
}

export default async function Page({ searchParams }: PageProps) {
  // 설정 누락은 렌더 전에 멈춘다.
  // generateMetadata에서 던져도 Next는 루트 metadata로 폴백해 200을 준다(실측: title이
  // "상품 목록 · Commerce" → "Commerce"로 떨어지고 로그에만 남는다). 본문의 prefetchQuery는
  // 설계상 실패를 삼키므로 거기서도 안 드러난다. 그래서 여기서 명시적으로 확인한다 —
  // 이게 없으면 잘못 배포된 서버가 200을 돌려주고 헬스체크를 통과한다.
  requireAppOrigin();

  const query = resolveProductListQuery(await searchParams);
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(productListQueryOptions(query));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* nuqs(useSearchParams 기반)는 Suspense 경계가 필요하다.
          이 fallback은 "URL 조건을 아직 못 읽음"을 뜻하고, Query의 isPending("서버 응답 대기")과 범위가 다르다. */}
      <Suspense
        fallback={
          <main className="shop-page">
            <p className="shop-state">상품 목록을 준비하는 중입니다…</p>
          </main>
        }
      >
        <ProductListPage />
      </Suspense>
    </HydrationBoundary>
  );
}
