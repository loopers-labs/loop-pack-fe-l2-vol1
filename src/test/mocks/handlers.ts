import { http, HttpResponse } from 'msw';
import type { HomeResponse } from '@/_pages/home/model';
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
];
