import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render-with-providers';
import { ProductListPage } from './ProductListPage';
import type { ProductListResponse } from '@/entities/product/model';

// 이 파일(항목 4~10) 전체에서 재사용하는 fixture.
// 실제 commerce.ts 데이터와 독립적으로, 정렬/가격이 겹치지 않게 구성해
// assertion이 명확해지도록 함.
const fixtureProducts: ProductListResponse['products'] = [
  {
    id: 'fx-1',
    brand: 'Fixture Brand',
    name: '테스트 원목 스탠드 조명',
    category: 'home',
    price: 10000,
    originalPrice: null,
    image: '/images/fixtures/fx-1.jpg',
    freeShipping: false,
    sizes: [],
    rating: 4.1,
    reviewCount: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fx-2',
    brand: 'Fixture Brand',
    name: '테스트 미니멀 벽시계',
    category: 'home',
    price: 20000,
    originalPrice: null,
    image: '/images/fixtures/fx-2.jpg',
    freeShipping: true,
    sizes: [],
    rating: 4.5,
    reviewCount: 50,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
];

const fixtureCategories: ProductListResponse['categories'] = [
  { id: 'home', name: '홈' },
];

function successResponse(
  overrides: Partial<ProductListResponse> = {},
): ProductListResponse {
  return {
    products: fixtureProducts,
    categories: fixtureCategories,
    totalCount: fixtureProducts.length,
    page: 1,
    pageSize: 12,
    ...overrides,
  };
}

describe('ProductListPage — 목록 로딩 → 성공 (항목 4)', () => {
  it('로딩 중에는 상품을 불러오는 중이라는 상태가 표시된다', () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json(successResponse())),
    );

    renderWithProviders(<ProductListPage />);

    expect(screen.getByLabelText('상품을 불러오는 중')).toBeInTheDocument();
  });

  it('응답이 오면 로딩 상태가 사라지고 상품 목록이 표시된다', async () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json(successResponse())),
    );

    renderWithProviders(<ProductListPage />);

    expect(await screen.findByText('테스트 원목 스탠드 조명')).toBeInTheDocument();
    expect(screen.getByText('테스트 미니멀 벽시계')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('상품을 불러오는 중'),
    ).not.toBeInTheDocument();
  });

  it('응답의 totalCount가 화면에 표시된다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(successResponse({ totalCount: 2 })),
      ),
    );
  
    renderWithProviders(<ProductListPage />);
  
    expect(
      await screen.findByText((_, element) => element?.textContent === '총 2개'),
    ).toBeInTheDocument();
  });
  
});