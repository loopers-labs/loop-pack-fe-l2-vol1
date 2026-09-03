import type { Category, Product } from '@/entities/product';

/**
 * 테스트 픽스처.
 *
 * mock 백엔드(app/api/_data/commerce.ts)의 데이터를 import 하지 않는다.
 * 그렇게 하면 mock 데이터가 바뀔 때마다 테스트 기대값이 따라 흔들리고,
 * "무엇을 검증하는 테스트인가"가 데이터에 가려진다.
 * 응답 "계약"(ProductListResponse)만 지키고 값은 여기서 직접 만든다.
 */
export const testCategories: Category[] = [
  { id: 'casual', name: '캐주얼' },
  { id: 'fashion', name: '패션' },
  { id: 'goods', name: '뷰티·잡화' },
  { id: 'home', name: '홈' },
  { id: 'digital', name: '디지털' },
];

/** 필요한 필드만 덮어써서 상품 하나를 만든다. */
export const makeProduct = (overrides: Partial<Product> & Pick<Product, 'id'>): Product => ({
  brand: '테스트브랜드',
  name: `테스트상품 ${overrides.id}`,
  category: 'casual',
  price: 10_000,
  originalPrice: null,
  image: `/images/products/${overrides.id}.jpg`,
  freeShipping: false,
  sizes: [{ value: 260, stock: 3 }],
  rating: 4.5,
  reviewCount: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

export const testProducts: Product[] = [
  makeProduct({ id: 'p1', name: '기본 티셔츠', price: 19_000 }),
  makeProduct({ id: 'p2', name: '데일리 스니커즈', category: 'fashion', price: 89_000 }),
  makeProduct({ id: 'p3', name: '핸드크림', category: 'goods', price: 7_500 }),
];
