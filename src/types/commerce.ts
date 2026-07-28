export type CategoryId = 'casual' | 'fashion' | 'goods' | 'home' | 'digital';

export type Category = {
  id: CategoryId;
  name: string;
};

export type ProductSort = 'latest' | 'popular' | 'price-asc' | 'price-desc';

export type MockApiScenario = 'empty' | 'error';

// [AI] 클라이언트/서버 양쪽에서 재사용하기 위해 시나리오 값과 타입 가드를 함께 둔다.
export const MOCK_API_SCENARIOS = ['empty', 'error'] as const satisfies readonly MockApiScenario[];

export const isMockApiScenario = (value: string | null | undefined): value is MockApiScenario =>
  value !== null && value !== undefined && MOCK_API_SCENARIOS.some((s) => s === value);

export type ProductListQuery = {
  q?: string;
  category?: CategoryId | 'all';
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: Array<{ value: number; stock: number }>;
  rating: number;
  reviewCount: number;
  createdAt: string;
};

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type ApiErrorResponse = {
  message: string;
};

// Product 객체 전체를 저장한은 게 아니라 최소 정보만 저장한다.
export type WishlistItem = Pick<Product, 'id'>;
export type CartItem = Pick<Product, 'id'>;
