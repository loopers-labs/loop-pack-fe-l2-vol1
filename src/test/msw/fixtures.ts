import type { ProductListResponse } from '@/entities/product/model/types';

export const productListFixture = {
  products: [
    {
      id: 'test-product-1',
      brand: '테스트 브랜드',
      name: '테스트 상품',
      category: 'casual',
      price: 39000,
      originalPrice: null,
      image: '/images/products/p1.jpg',
      freeShipping: true,
      sizes: [],
      rating: 4.8,
      reviewCount: 120,
      createdAt: '2026-07-10T09:00:00.000Z',
    },
  ],
  categories: [
    { id: 'casual', name: '캐주얼' },
    { id: 'fashion', name: '패션' },
    { id: 'goods', name: '뷰티·잡화' },
    { id: 'home', name: '홈' },
    { id: 'digital', name: '디지털' },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 10,
} satisfies ProductListResponse;
