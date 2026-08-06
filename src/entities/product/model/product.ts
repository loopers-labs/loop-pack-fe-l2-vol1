export type CategoryId = 'casual' | 'fashion' | 'goods' | 'home' | 'digital';

export type Category = {
  id: CategoryId;
  name: string;
};

export const PRODUCT_SORTS = ['latest', 'popular', 'price-asc', 'price-desc'] as const;
export type ProductSort = 'latest' | 'popular' | 'price-asc' | 'price-desc';

export type MockApiScenario = 'empty' | 'error' | 'slow';

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

export const DEFAULT_PRODUCT_LIST_QUERY: Required<
  Pick<ProductListQuery, 'q' | 'category' | 'sort' | 'page'>
> = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
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
