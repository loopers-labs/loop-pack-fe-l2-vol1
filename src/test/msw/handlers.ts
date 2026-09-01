import { http, HttpResponse } from 'msw';
import type { HomeResponse } from '@/_pages/home/model';
import type { ProductListResponse } from '@/entities/product/model';

// 0단계 sanity check용 최소 데이터.
// 15개 항목별 상세 fixture는 1단계 설계 완료 후 2단계에서 별도로 구성함.
const minimalHomeResponse: HomeResponse = {
  banner: {
    title: 'sanity 배너',
    description: 'sanity 설명',
    image: '/sanity.jpg',
  },
  categories: [{ id: 'casual', name: '캐주얼' }],
  popularProducts: [],
  newProducts: [],
};

const minimalProductListResponse: ProductListResponse = {
  products: [],
  categories: [{ id: 'casual', name: '캐주얼' }],
  totalCount: 0,
  page: 1,
  pageSize: 12,
};

export const handlers = [
  http.get('/api/home', () => HttpResponse.json(minimalHomeResponse)),
  http.get('/api/products', () =>
    HttpResponse.json(minimalProductListResponse),
  ),
  // 헤더가 모든 화면에서 로그인 상태를 조회하므로, 기본값은 비로그인(401)으로 둔다.
  // 로그인 상태를 테스트해야 하는 곳은 server.use()로 개별 오버라이드한다.
  http.get('/api/auth/me', () =>
    HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
  ),
];
