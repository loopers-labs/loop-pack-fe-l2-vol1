// AI 생성: route.ts의 필터·정렬·페이징 계산을 순수 함수로 분리(테스트 용이성).
// 입력값 검증(400)과 목업 지연(waitForMockApi)은 HTTP 경계인 route.ts 책임으로 남긴다.
// q는 이미 정규화(trim + ko 소문자)된 값이 들어온다고 가정한다 — route.ts·toProductListQuery가 모두 선행 처리한다.
import { categories, products } from '../_data/commerce';
import type { MockApiScenario } from '../_data/commerce';
import type { ProductListResponse, ProductSort } from '@/entities/product';

type ProductListDataInput = {
  q: string;
  category: string | null;
  sort: ProductSort | null;
  page: number;
  pageSize: number;
  scenario?: MockApiScenario | null;
};

export function getProductListData({ q, category, sort, page, pageSize, scenario }: ProductListDataInput): ProductListResponse {
  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === null || category === 'all' || product.category === category;
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase('ko');
    return matchesCategory && searchable.includes(q);
  });

  const sortedProducts = [...filteredProducts];

  if (sort !== null) {
    sortedProducts.sort((a, b) => {
      switch (sort) {
        case 'popular':
          return b.reviewCount - a.reviewCount || b.rating - a.rating;
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'latest':
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }
    });
  }

  const start = (page - 1) * pageSize;
  const pagedProducts = sortedProducts.slice(start, start + pageSize);

  return {
    products: scenario === 'empty' ? [] : pagedProducts,
    categories,
    totalCount: scenario === 'empty' ? 0 : filteredProducts.length,
    page,
    pageSize
  };
}
