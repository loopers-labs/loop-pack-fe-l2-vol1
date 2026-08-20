import type {
  Category,
  HomeResponse,
  Product,
  ProductListResponse,
} from '@/types/commerce';

// 통합 테스트용 고정 데이터 — 스타터 mock 데이터(app/api/_data)를 쓰지 않는다.
// 그쪽이 바뀌면 관계없는 테스트가 무더기로 깨지고, 무엇을 전제했는지도 파일 밖으로 새어 나간다.
export const testCategories: Category[] = [
  { id: 'casual', name: '캐주얼' },
  { id: 'fashion', name: '패션' },
  { id: 'goods', name: '뷰티·잡화' },
  { id: 'home', name: '홈' },
  { id: 'digital', name: '디지털' },
];

export function makeProduct(
  overrides: Partial<Product> & Pick<Product, 'id'>,
): Product {
  return {
    brand: '테스트 브랜드',
    name: `테스트 상품 ${overrides.id}`,
    category: 'casual',
    price: 10_000,
    originalPrice: null,
    image: `/images/products/${overrides.id}.jpg`,
    freeShipping: false,
    sizes: [],
    rating: 4.5,
    reviewCount: 10,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

// totalCount는 products에서 파생시킨다 — 목록과 개수가 어긋난 응답을 실수로 만들지 않도록.
// 둘이 어긋나는 상황(페이지 초과 등)이 검증 대상일 때만 totalCount를 직접 넘긴다.
export function makeProductList(
  overrides: Partial<ProductListResponse> = {},
): ProductListResponse {
  const products = overrides.products ?? [
    makeProduct({ id: 'p1' }),
    makeProduct({ id: 'p2' }),
  ];
  return {
    products,
    categories: testCategories,
    totalCount: products.length,
    page: 1,
    pageSize: 12,
    ...overrides,
  };
}

export function makeHome(overrides: Partial<HomeResponse> = {}): HomeResponse {
  return {
    banner: {
      title: '테스트 배너',
      description: '테스트 배너 설명',
      image: '/images/products/p1.jpg',
    },
    categories: testCategories,
    popularProducts: [makeProduct({ id: 'p1' })],
    newProducts: [makeProduct({ id: 'p2' })],
    ...overrides,
  };
}
