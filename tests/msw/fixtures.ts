import type {
  HomeResponse,
  Product,
  ProductListResponse,
} from '@/entities/product';

/** 응답 형태는 앱 타입에서 가져와, 계약이 바뀌면 픽스처가 먼저 깨지게 한다. */
export const PRODUCT: Product = {
  id: 'p9',
  brand: 'Loopers Select',
  name: '오크 원형 사이드 테이블',
  category: 'home',
  price: 89000,
  originalPrice: null,
  image: '/images/products/p9.jpg',
  freeShipping: true,
  sizes: [],
  rating: 4.7,
  reviewCount: 128,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const HOME_RESPONSE: HomeResponse = {
  banner: {
    title: '배너 제목',
    description: '배너 설명',
    image: '/banner.jpg',
  },
  categories: [{ id: 'home', name: '홈' }],
  popularProducts: [PRODUCT],
  newProducts: [],
};

export const PRODUCT_LIST_RESPONSE: ProductListResponse = {
  products: [PRODUCT],
  categories: [{ id: 'home', name: '홈' }],
  totalCount: 1,
  page: 1,
  pageSize: 12,
};
