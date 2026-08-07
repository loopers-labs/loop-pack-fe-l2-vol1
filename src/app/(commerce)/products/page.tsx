import type { Metadata } from 'next';
import { connection } from 'next/server';
import type { SearchParams } from 'nuqs/server';

import { ProductsPage } from '@/_pages/products';
import { productQueries } from '@/entities/product';
import {
  loadProductListConditions,
  PRODUCT_SORT_LABEL,
  toProductListQuery,
} from '@/features/product';
import { getQueryClient } from '@/shared/get-query-client';

/** 결과가 0건이면 보여줄 상품 이미지가 없다. 공유 카드가 비지 않게 대표 이미지를 쓴다. */
const FALLBACK_OG_IMAGE = '/images/products/p6.jpg';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  await connection();

  const conditions = await loadProductListConditions(searchParams);
  const queryClient = getQueryClient();

  try {
    const list = await queryClient.fetchQuery(
      productQueries.list(toProductListQuery(conditions)),
    );

    // 카테고리명은 상수가 아니라 응답에서 찾는다. 목록과 같은 출처여야 화면과 어긋나지 않는다.
    const categoryName =
      list.categories.find(({ id }) => id === conditions.category)?.name ??
      '전체';

    const subject = conditions.q
      ? `"${conditions.q}" 검색 결과`
      : `${categoryName} 상품`;

    return {
      title:
        conditions.page > 1 ? `${subject} ${conditions.page}페이지` : subject,
      description: `카테고리 ${categoryName} · 정렬 ${PRODUCT_SORT_LABEL[conditions.sort]} · 상품 ${list.totalCount}개`,
      openGraph: {
        siteName: 'LOOP MALL',
        locale: 'ko_KR',
        type: 'website',
        images: [list.products[0]?.image ?? FALLBACK_OG_IMAGE],
      },
    };
  } catch {
    return {};
  }
}

export default function Products({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <ProductsPage searchParams={searchParams} />;
}
