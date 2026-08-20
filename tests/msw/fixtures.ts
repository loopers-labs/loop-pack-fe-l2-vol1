import type { Category, HomeResponse, Product } from '@/entities/product';

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

export const CATEGORIES: Category[] = [
  { id: 'home', name: '홈' },
  { id: 'casual', name: '캐주얼' },
];

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

const HOME_PRODUCT_COUNT = 13;

const OTHER_PRODUCT_COUNT = 12;

const HIGHEST_PRICE = 100_000;

const PRICE_STEP = 1_000;

const NEWEST_CREATED_AT = Date.parse('2026-07-01T00:00:00.000Z');

const DAY = 24 * 60 * 60 * 1000;

const numbered = (label: string, index: number) =>
  `${label} ${String(index + 1).padStart(2, '0')}`;

const homeProducts = Array.from({ length: HOME_PRODUCT_COUNT }, (_, index) => ({
  ...PRODUCT,
  name: numbered('홈 상품', index),
  category: 'home' as const,
}));

const otherProducts = Array.from(
  { length: OTHER_PRODUCT_COUNT },
  (_, index) => ({
    ...PRODUCT,
    name: numbered('일반 상품', index),
    category: 'casual' as const,
  }),
);

const interleaved = homeProducts.flatMap((homeProduct, index) => {
  const otherProduct = otherProducts[index];

  return otherProduct ? [homeProduct, otherProduct] : [homeProduct];
});

export const PRODUCTS: Product[] = interleaved.map((product, index) => {
  const distanceToEdge = Math.min(index, interleaved.length - 1 - index);

  return {
    ...product,
    id: `p${String(index + 1).padStart(2, '0')}`,
    price: HIGHEST_PRICE - index * PRICE_STEP,
    reviewCount: 10 + distanceToEdge * 10,
    createdAt: new Date(NEWEST_CREATED_AT - index * DAY).toISOString(),
  };
});
