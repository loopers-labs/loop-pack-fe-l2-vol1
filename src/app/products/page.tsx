import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import {
  loadProductSearchParams,
  ProductListPage,
  productListQueries,
  serializeProductsUrl,
  sortFilterOptions,
  type ProductSearchState,
} from "@/_pages/products";
import { getProductListResponse } from "@/app/api/products/product-list-response";
import { getQueryClient } from "@/shared/api/get-query-client";
import { sharedOpenGraph } from "@/shared/config/seo";
import type { ProductListResponse } from "@/types/commerce";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// 서버에서는 Route Handler HTTP 왕복 대신 데이터 함수를 직접 호출한다.
// queryKey의 정규화된 조건을 그대로 넘겨 클라이언트 refetch(HTTP)와 키·조건을 일치시킨다
const productListServerQuery = (search: ProductSearchState) => {
  const options = productListQueries.list(search);
  return { ...options, queryFn: () => getProductListResponse(options.queryKey[1]) };
};

const buildTitle = (search: ProductSearchState) => {
  const q = search.q.trim();
  const base = q === "" ? "상품 목록" : `"${q}" 검색 결과`;
  return search.page >= 2 ? `${base} ${search.page}페이지` : base;
};

const buildDescription = (search: ProductSearchState, result: ProductListResponse) => {
  const categoryName =
    search.category === "all"
      ? "전체"
      : (result.categories.find((category) => category.id === search.category)?.name ??
        search.category);
  const sortLabel =
    sortFilterOptions.find((option) => option.value === search.sort)?.label ?? search.sort;

  if (result.totalCount === 0) {
    return `${categoryName} 카테고리(${sortLabel}) 조건에 맞는 상품이 0개입니다. 다른 조건으로 검색해 보세요.`;
  }
  return `${categoryName} 카테고리 상품 ${result.totalCount}개를 ${sortLabel}으로 만나보세요.`;
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const search = loadProductSearchParams(await searchParams);
  const canonical = serializeProductsUrl("/products", search);
  const queryClient = getQueryClient();

  try {
    const result = await queryClient.fetchQuery(productListServerQuery(search));
    const title = buildTitle(search);
    const description = buildDescription(search, result);
    const firstProduct = result.products[0];

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        ...sharedOpenGraph,
        title,
        description,
        url: canonical,
        // 상품 이미지 크기는 API가 알려주지 않으므로 alt만 채운다.
        // 0건이면 키를 만들지 않아 sharedOpenGraph의 fallback 이미지가 남는다
        ...(firstProduct !== undefined
          ? {
              images: [
                { url: firstProduct.image, alt: `${firstProduct.brand} ${firstProduct.name}` },
              ],
            }
          : {}),
      },
    };
  } catch {
    // metadata 조회 실패 시 title·description·og는 root 공통 metadata를 상속한다.
    // canonical은 조회 결과와 무관하게 URL만으로 정해지므로 실패해도 유지한다
    return { alternates: { canonical } };
  }
}

// prefetch를 await하지 않고 pending 상태로 dehydrate해 셸을 먼저 스트리밍한다.
// metadata의 fetchQuery와는 데이터 함수의 React cache로 요청당 한 번만 실행된다
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const search = loadProductSearchParams(await searchParams);
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(productListServerQuery(search));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListPage />
    </HydrationBoundary>
  );
}
