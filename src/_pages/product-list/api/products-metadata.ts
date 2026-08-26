import type { ProductListQuery } from '@/entities/product/model';
import type { ProductListResponse } from '@/entities/product/model';

const categoryNameMap: Record<string, string> = {
  casual: '캐주얼',
  fashion: '패션',
  goods: '뷰티·잡화',
  home: '홈',
  digital: '디지털',
};

const sortNameMap: Record<string, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '낮은 가격순',
  'price-desc': '높은 가격순',
};

type BuildProductsMetadataParams = {
  query: ProductListQuery;
  data: ProductListResponse;
};

export function buildProductsMetadataText({
  query,
  data,
}: BuildProductsMetadataParams) {
  const page = query.page ?? 1;

  // title: 검색어 우선, 2페이지 이상이면 페이지 번호 추가
  let title = '상품 둘러보기';
  if (query.q) {
    title = `'${query.q}' 검색 결과`;
  } else if (
    query.category &&
    query.category !== 'all' &&
    categoryNameMap[query.category]
  ) {
    title = `${categoryNameMap[query.category]} 상품`;
  }
  if (page > 1) {
    title = `${title} - ${page}페이지`;
  }

  // description: category/sort 반영
  const descParts: string[] = [];
  if (
    query.category &&
    query.category !== 'all' &&
    categoryNameMap[query.category]
  ) {
    descParts.push(categoryNameMap[query.category]);
  }
  if (query.sort && sortNameMap[query.sort]) {
    descParts.push(sortNameMap[query.sort]);
  }
  const description =
    descParts.length > 0
      ? `${descParts.join(' · ')} 카테고리의 상품 ${data.totalCount}개를 확인해보세요.`
      : `카테고리와 가격 조건으로 상품 ${data.totalCount}개를 찾아보세요.`;

  return { title, description };
}
