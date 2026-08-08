// AI 생성: week-07 3단계 — 본문과 같은 parser(productListParsers)·같은 query factory(productQueries.list)를
// 써서 같은 URL 정규화·GET URL·options를 만든다. 필터 파싱은 try 밖에 둬 root 상속 대상을 "조회 실패"로만
// 한정한다. getQueryClient()는 호출마다 새 인스턴스라 본문과 Query 캐시를 공유하지 않는다.
import type { Metadata } from 'next';
import { createLoader } from 'nuqs/server';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { commonOpenGraph, OG_FALLBACK_IMAGE } from '@/shared/config/siteMetadata';
import { FIRST_PAGE, SORT_LABELS } from '../model/productListConstants';
import { productListParsers } from '../model/productListFilters';
import { productQueries } from './productQueries';

type ProductListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const loadFilters = createLoader(productListParsers);

export async function generateProductListMetadata({ searchParams }: ProductListPageProps): Promise<Metadata> {
  const filters = loadFilters(await searchParams);

  try {
    const productList = await getQueryClient().fetchQuery(productQueries.list(filters));

    const trimmedQuery = filters.q.trim();
    const categoryName = filters.category === 'all' ? '전체' : (productList.categories.find((category) => category.id === filters.category)?.name ?? filters.category);
    const sortLabel = SORT_LABELS[filters.sort];

    const base = trimmedQuery ? `'${trimmedQuery}' 검색 결과` : '상품 목록';
    const title = filters.page > FIRST_PAGE ? `${base} (${filters.page}페이지)` : base;
    const description = [trimmedQuery && `'${trimmedQuery}'`, categoryName, sortLabel, `총 ${productList.totalCount}개`].filter(Boolean).join(' · ');
    const ogImage = productList.products[0]?.image ?? OG_FALLBACK_IMAGE;

    return {
      title,
      description,
      openGraph: {
        ...commonOpenGraph,
        title,
        description,
        images: [ogImage]
      }
    };
  } catch {
    return {};
  }
}
