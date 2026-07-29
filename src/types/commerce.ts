export const CATEGORY_IDS = [
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Category = {
  id: CategoryId;
  name: string;
};

export const PRODUCT_SORTS = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export type MockApiScenario = 'empty' | 'error';

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
