import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProductListView } from "@/_pages/products/ui/ProductListView";
import { productListQueryOptions } from "@/features/products/api/queries";
// features/products는 barrel(index)을 두지 않는다. 세그먼트를 직접 import한다.
// searchParams 파서는 서버 loader·serializer로도 그대로 재사용한다(검증 로직 중복 없음).
import {
  loadProductListSearchParams,
  serializeProductListSearchParams,
} from "@/features/products/model/searchParams";
import { SORT_OPTIONS } from "@/features/products/ui/filterOptions";
import { getServerQueryClient } from "@/shared/api/getServerQueryClient";
import { makeQueryClient } from "@/shared/api/queryClient";
import { buildPageMetadata } from "@/shared/config/siteMetadata";

// 본문과 같은 query factory·정규화 URL로 목록을 조회해 metadata를 만든다. 본문(page)과 별개 QueryClient라
// 캐시를 공유하지 않고, 같은 GET URL·options의 native fetch가 request 안에서 memoization돼 Route Handler는
// 한 번만 호출된다(서버 로그로 확인). 조회 실패 시 페이지별 빈 값이 아니라 root 공통 metadata를 상속한다.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const query = await loadProductListSearchParams(searchParams);
  // 본문 redirect와 같은 정규화로 만든 canonical URL을 og:url·canonical에 쓴다.
  const url = serializeProductListSearchParams("/products", query);

  try {
    const data = await makeQueryClient().fetchQuery(productListQueryOptions(query));

    const categoryName =
      query.category === "all"
        ? "전체 상품"
        : (data.categories.find((category) => category.id === query.category)?.name ?? "상품");
    const sortLabel = SORT_OPTIONS.find((option) => option.value === query.sort)?.label ?? "";
    const pageSuffix = query.page > 1 ? ` — ${query.page}페이지` : "";
    const subject = query.q ? `"${query.q}" 검색` : categoryName;

    // 성공 + 0건: URL 조건과 0개임을 설명한다. image를 안 주면 공통 fallback이 유지된다.
    if (data.totalCount === 0) {
      return buildPageMetadata({
        title: `${subject} 결과 없음${pageSuffix}`,
        description: `${categoryName} · ${sortLabel} 조건에 맞는 상품이 없습니다(0개).`,
        url,
      });
    }

    // 검색어를 title에 먼저, category·sort는 description에, 2페이지 이상은 title에 페이지 번호를 반영한다.
    return buildPageMetadata({
      title: query.q ? `"${query.q}" 검색 결과${pageSuffix}` : `${categoryName}${pageSuffix}`,
      description: `${categoryName} · ${sortLabel}`,
      image: data.products[0]?.image,
      url,
    });
  } catch {
    return {};
  }
}

// app은 라우팅만. 화면 조합은 _pages가 소유한다.
// searchParams를 서버에서 읽어 라우트가 동적이 되므로, useSearchParams의 CSR-bailout이 사라져
// Suspense 경계가 필요 없다(빌드로 확인). fetchQuery로 목록을 프리패치해 page 범위를 검사(초과 시 redirect)하고,
// HydrationBoundary로 넘겨 클라 재요청을 막는다(홈과 일관, waterfall 제거).
export default async function ProductList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await loadProductListSearchParams(searchParams);
  const queryClient = getServerQueryClient();
  const data = await queryClient.fetchQuery(productListQueryOptions(query));

  // page가 마지막을 넘으면 서버에서 캐노니컬 URL(page 1)로 정정한다.
  // 클라이언트는 이후 유효한 page만 보므로, 목록 자리에 잘못된 page 상태가 생기지 않는다.
  const totalPages = Math.max(1, Math.ceil(data.totalCount / query.pageSize));
  if (query.page > totalPages) {
    redirect(serializeProductListSearchParams("/products", { ...query, page: 1 }));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListView />
    </HydrationBoundary>
  );
}
