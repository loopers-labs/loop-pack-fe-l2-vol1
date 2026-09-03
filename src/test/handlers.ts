import type { HomeResponse } from '@/_pages/home/model/types';
import type { ProductListResponse } from '@/_pages/product-list/model/types';
import { HttpResponse, http } from 'msw';

import { testCategories, testProducts } from './fixtures';

/**
 * 기본 핸들러 — **성공 경로만** 둔다.
 *
 * 실패·빈 결과·지연은 여기 넣지 않고 그 테스트 안에서 `server.use(...)` 로 덮는다.
 * 기본 핸들러에 시나리오 분기를 넣으면 어떤 테스트가 무엇을 기대하는지
 * 파일을 넘나들며 읽어야 한다.
 *
 * 경로는 상대경로다. jsdom base URL 이 http://localhost:3000 으로 고정돼 있어
 * apiClient 의 브라우저 분기(`/api/...`)가 이 핸들러에 잡힌다.
 */
const productListResponse: ProductListResponse = {
  products: testProducts,
  categories: testCategories,
  totalCount: testProducts.length,
  page: 1,
  pageSize: 12,
};

const homeResponse: HomeResponse = {
  banner: {
    title: '매일 새롭게 발견하는 취향',
    description: '지금 가장 사랑받는 상품을 만나보세요.',
    image: '/images/week-07/hero-original.jpg',
  },
  categories: testCategories,
  popularProducts: testProducts,
  newProducts: testProducts,
};

export const handlers = [
  http.get('/api/products', () => HttpResponse.json(productListResponse)),
  http.get('/api/home', () => HttpResponse.json(homeResponse)),
];
