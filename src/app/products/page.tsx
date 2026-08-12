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
import { getQueryClient } from "@/shared/api/get-query-client";
import { sharedOpenGraph } from "@/shared/config/seo";
import type { ProductListResponse } from "@/types/commerce";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
    const result = await queryClient.fetchQuery(productListQueries.list(search));
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

// metadata와 본문은 각자 새 QueryClient를 쓰고, 같은 GET URL의 native fetch memoization으로 dedupe된다
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const search = loadProductSearchParams(await searchParams);
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(productListQueries.list(search));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListPage />
    </HydrationBoundary>
  );
}
