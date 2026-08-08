import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ProductsPage } from '@/_pages/products/ui/ProductsPage';
import { productQueries } from '@/_pages/products/api/products.queries';
import { loadProductFilters } from '@/_pages/products/model/productFilterParsers';
import { getQueryClient } from '../../get-query-client';
import { FALLBACK_OG_IMAGE, sharedOpenGraph } from '../../shared-metadata';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const CATEGORY_LABELS: Record<string, string> = {
  all: '전체',
  casual: '캐주얼',
  fashion: '패션',
  goods: '뷰티·잡화',
  home: '홈',
  digital: '디지털',
};

const SORT_LABELS: Record<string, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '가격 낮은순',
  'price-desc': '가격 높은순',
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  // 본문과 같은 URL 정규화(nuqs 파서 공유) — 같은 query factory로 같은 GET URL을 만든다.
  const filters = loadProductFilters(await searchParams);
  const queryClient = getQueryClient();

  try {
    const list = await queryClient.fetchQuery(productQueries.list(filters));

    // 검색어를 title에 먼저, 2페이지 이상은 페이지 번호를 title에.
    const titleParts: string[] = [];
    if (filters.q) titleParts.push(`"${filters.q}" 검색 결과`);
    else titleParts.push('상품 목록');
    if (filters.page >= 2) titleParts.push(`${filters.page}페이지`);
    const title = titleParts.join(' · ');

    // category·sort는 description에.
    const description =
      list.totalCount === 0
        ? `${CATEGORY_LABELS[filters.category]} 카테고리 · ${SORT_LABELS[filters.sort]} — 조건에 맞는 상품이 0개입니다.`
        : `${CATEGORY_LABELS[filters.category]} 카테고리 · ${SORT_LABELS[filters.sort]} — 상품 ${list.totalCount}개`;

    // 정상 empty에도 Open Graph fallback image를 유지한다.
    const firstImage = list.products[0]?.image;

    return {
      title,
      description,
      openGraph: {
        ...sharedOpenGraph,
        title,
        description,
        images: [firstImage ?? FALLBACK_OG_IMAGE],
      },
    };
  } catch {
    // 조회 실패 시 root 공통 metadata 상속.
    return {};
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = loadProductFilters(await searchParams);
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(productQueries.list(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsPage />
    </HydrationBoundary>
  );
}
