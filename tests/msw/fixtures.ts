import type { Category, HomeResponse, Product } from '@/entities/product';
import type { SessionUser } from '@/entities/session';

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

// 홈만 13개로 pageSize(12)를 넘겨 홈에도 2페이지가 있게 둔다.
// 홈이 1페이지뿐이면 page 초과 보정이 "조건 변경 시 1페이지로 리셋" 누락을 가린다.
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

// price·createdAt은 인덱스 단조라 기본 순서 = latest = price-desc로 셋이 같다.
// price-asc만 기본 순서와 달라 정렬 테스트는 price-asc를 쓴다.
// reviewCount는 가운데가 높은 텐트 모양이라 popular가 네 번째 순서를 만들지만 아직 쓰는 테스트는 없다.
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

export const SESSION_PASSWORD = 'looper1234';

export const SESSION_USER: SessionUser = {
  id: 'u1',
  name: '루퍼1',
  email: 'looper1@loopers.dev',
};
