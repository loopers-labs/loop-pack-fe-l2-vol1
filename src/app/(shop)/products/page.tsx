import { Suspense } from 'react';

import { productListQueryOptions } from '@/_pages/product-list/api/productListQueries';
import { toProductListQueryFromSearchParams } from '@/_pages/product-list/model/toProductListQuery';
import { ProductListPage } from '@/_pages/product-list/ui/ProductListPage';
import type { ProductSort } from '@/entities/product';
import type { RawSearchParams } from '@/features/product-filter';
import { getQueryClient } from '@/shared/api/queryClient';
import { COMMON_OPEN_GRAPH, toOpenGraphImages } from '@/shared/config/siteMetadata';
import type { Metadata } from 'next';

type ProductsPageProps = {
  searchParams: Promise<RawSearchParams>;
};

const SORT_LABEL: Record<ProductSort, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '낮은 가격순',
  'price-desc': '높은 가격순',
};

/**
 * 상품 목록 metadata.
 *
 * URL 정규화와 query factory 를 본문과 공유한다.
 * toProductListQueryFromSearchParams 는 클라이언트가 nuqs 로 만드는 것과 같은
 * ProductListQuery 를 내고, productListQueryOptions 가 같은 GET URL·options 를 만든다.
 *
 * title·description 규칙
 * - 검색어가 있으면 title 에 먼저 넣는다. 사용자가 무엇을 찾았는지가 가장 중요하다.
 * - category·sort 는 description 으로 보낸다. 제목이 길어지면 검색 결과에서 잘린다.
 * - 2페이지 이상이면 title 에 페이지 번호를 넣어 같은 제목의 문서가 겹치지 않게 한다.
 *
 * 조회가 실패하면 빈 객체를 돌려 root 공통 metadata 를 그대로 상속한다.
 * 페이지별 빈 값을 만들면 title 이 비거나 og 이미지가 사라진다.
 */
export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const query = toProductListQueryFromSearchParams(await searchParams);
  const queryClient = getQueryClient();

  try {
    const data = await queryClient.fetchQuery(productListQueryOptions.list(query));

    const categoryName =
      query.category && query.category !== 'all'
        ? (data.categories.find((category) => category.id === query.category)?.name ?? query.category)
        : undefined;

    const titleParts = [query.q ? `"${query.q}" 검색 결과` : (categoryName ?? '상품 목록')];
    if (query.page !== undefined && query.page > 1) titleParts.push(`${query.page}페이지`);
    const title = titleParts.join(' · ');

    const descriptionParts: string[] = [];
    if (categoryName) descriptionParts.push(`카테고리 ${categoryName}`);
    descriptionParts.push(`정렬 ${SORT_LABEL[query.sort ?? 'latest']}`);
    descriptionParts.push(data.totalCount > 0 ? `총 ${data.totalCount}개` : '조건에 맞는 상품 0개');

    const description = `${descriptionParts.join(' · ')}.`;

    return {
      title,
      description,
      openGraph: {
        ...COMMON_OPEN_GRAPH,
        title,
        description,
        // 결과가 0개면 첫 상품이 없다. 그때는 공통 fallback 이미지를 유지한다.
        images: toOpenGraphImages(data.products[0]?.image, title),
      },
    };
  } catch {
    return {};
  }
}

/**
 * 상품 목록 (`/products`).
 * 조건의 원본이 URL(nuqs)이므로 목록 데이터는 클라이언트에서 조회한다.
 *
 * 바깥 Suspense: nuqs가 쓰는 useSearchParams는 정적 프리렌더 시 Suspense 경계를 요구한다(빌드 요건) /
 *   런타임(하이드레이션 후)에는 ProductListPage가 suspend하지 않아 이 fallback은 뜨지 않는다.
 * 필터 변경 시 로딩은 ProductListPage 내부의 결과 전용 경계만 처리하므로 필터 폼은 유지된다.
 */
export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="week05-section">상품을 준비하고 있습니다…</p>}>
      <ProductListPage />
    </Suspense>
  );
}
