import { http, HttpResponse } from 'msw';
import type { HomeResponse } from '@/_pages/home/model';
import type { OrderListResponse } from '@/entities/order/model';
import type { ProductListResponse } from '@/entities/product/model';

// [AI] MSW 기본 핸들러용 fixture 데이터. 라우트 핸들러의 정렬·필터링 로직을
// 재현하지 않고, 통합 테스트에서 검증하기 좋은 최소 데이터만 제공한다.
// 실패·빈 결과·지연은 테스트 안에서 server.use()로 덮어쓴다 (line 149).
export const categories = [
  { id: 'casual' as const, name: '캐주얼' },
  { id: 'digital' as const, name: '디지털' },
];

export const sampleProducts = [
  {
    id: 'test-1',
    brand: '테스트 브랜드',
    name: '테스트 상품 1',
    category: 'casual' as const,
    price: 50000,
    originalPrice: 70000,
    image: '/images/products/test-1.jpg',
    freeShipping: true,
    sizes: [{ value: 26, stock: 10 }],
    rating: 4.5,
    reviewCount: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'test-2',
    brand: '테스트 브랜드',
    name: '테스트 상품 2',
    category: 'digital' as const,
    price: 30000,
    originalPrice: null,
    image: '/images/products/test-2.jpg',
    freeShipping: false,
    sizes: [],
    rating: 4.0,
    reviewCount: 50,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

// [AI] 주문 내역 fixture. 실제 API는 세션 쿠키가 없으면 401을 돌려주지만,
// 기본 핸들러는 성공 경로만 둔다. 401(로그인 필요)·빈 결과는 테스트에서 server.use()로 덮어쓴다.
export const sampleOrders = [
  {
    id: 'o1',
    createdAt: '2026-08-01T10:00:00.000Z',
    items: [
      { productId: 'p1', quantity: 2 },
      { productId: 'p3', quantity: 1 },
    ],
  },
  {
    id: 'o2',
    createdAt: '2026-08-15T18:30:00.000Z',
    items: [{ productId: 'p2', quantity: 1 }],
  },
] satisfies OrderListResponse['orders'];

export const handlers = [
  http.get('*/api/home', () =>
    HttpResponse.json({
      banner: {
        title: '테스트 배너',
        description: '테스트 설명',
        image: '/images/products/test-1.jpg',
      },
      categories,
      popularProducts: sampleProducts,
      newProducts: sampleProducts,
    } satisfies HomeResponse)
  ),

  http.get('*/api/products', () =>
    HttpResponse.json({
      products: sampleProducts,
      categories,
      totalCount: sampleProducts.length,
      page: 1,
      pageSize: 12,
    } satisfies ProductListResponse)
  ),

  http.get('*/api/orders', () =>
    HttpResponse.json({ orders: sampleOrders } satisfies OrderListResponse)
  ),

  // [AI] me 기본 핸들러는 "로그인 안 함"(401)이다 — 테스트의 기본 상태가 미로그인이므로.
  // 로그인 상태가 필요한 테스트에서 server.use()로 200으로 덮어쓴다.
  http.get('*/api/auth/me', () =>
    HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
  ),
];
