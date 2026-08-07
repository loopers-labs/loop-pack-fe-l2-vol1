import type { Metadata } from 'next';
import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../getQueryClient';
import { productListQueryOptions } from '@/entities/product/api/productQueries';
import { searchParamsCache } from '@/entities/product/lib/searchParamsParsers';
import { ProductListErrorBoundary } from './_components/ProductListErrorBoundary';
import { ProductListContent } from '@/_pages/product-list/ui/ProductListContent';
import { ProductListSkeleton } from '@/_pages/product-list/ui/ProductListSkeleton';
import type { ProductSort } from '@/entities/product/model/types';

const OG_COMMON = {
  siteName: 'Aesthetic',
  locale: 'ko_KR',
  type: 'website',
} as const;

const SORT_LABELS: Record<ProductSort, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '가격 낮은순',
  'price-desc': '가격 높은순',
};

const FALLBACK_OG_IMAGE = '/images/week-07/hero-1920.webp';

interface ProductListPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: ProductListPageProps): Promise<Metadata> {
  try {
    const { q, category, sort, page, scenario } = await searchParamsCache.parse(searchParams);

    const query = {
      q: q || undefined,
      category,
      sort,
      page,
      scenario: scenario || undefined,
    };
    const queryClient = getQueryClient();
    const data = await queryClient.fetchQuery(productListQueryOptions(query));

    const { products, categories, totalCount } = data;
    const categoryName =
      category && category !== 'all'
        ? categories.find((c) => c.id === category)?.name
        : undefined;

    const titleParts: string[] = [];
    if (q) {
      titleParts.push(`'${q}' 검색 결과`);
    } else {
      titleParts.push('지금 가장 사랑받는 아이템');
    }
    if (page > 1) {
      titleParts.push(`(${page}페이지)`);
    }
    const title = titleParts.join(' ');

    let description: string;
    if (totalCount === 0) {
      if (q) description = `'${q}'에 대한 검색 결과가 없습니다.`;
      else if (categoryName)
        description = `${categoryName} 카테고리에 상품이 없습니다.`;
      else description = '조건에 맞는 상품이 없습니다.';
    } else {
      const parts: string[] = [];
      if (categoryName) parts.push(categoryName);
      parts.push(`${SORT_LABELS[sort]} 총 ${totalCount}개`);
      if (q) parts.push(`'${q}' 검색 결과`);
      description = parts.join(' · ');
    }

    const ogImage = products.length > 0 ? products[0].image : FALLBACK_OG_IMAGE;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Aesthetic`,
        description,
        images: [{ url: ogImage }],
        ...OG_COMMON,
      },
    };
  } catch {
    return {};
  }
}

async function ProductListLoader({
  searchParams,
}: ProductListPageProps) {
  const { q, category, sort, page, scenario } = await searchParamsCache.parse(searchParams);
  const queryClient = getQueryClient();

  const query = {
    q: q || undefined,
    category,
    sort,
    page,
    scenario: scenario || undefined,
  };

  await queryClient.ensureQueryData(productListQueryOptions(query));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListContent />
    </HydrationBoundary>
  );
}

export default function ProductListPage({
  searchParams,
}: ProductListPageProps) {
  return (
    <ProductListErrorBoundary>
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductListLoader searchParams={searchParams} />
      </Suspense>
    </ProductListErrorBoundary>
  );
}
