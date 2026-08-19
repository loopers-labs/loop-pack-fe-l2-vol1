import type {
  Category,
  CategoryId,
  Product,
  ProductSort,
} from '../model/types';

export const PRODUCT_LIST_SCENARIOS = ['empty', 'error', 'slow'] as const;

export type ProductListScenario = (typeof PRODUCT_LIST_SCENARIOS)[number];

export type ProductListQuery = {
  q?: string;
  category?: CategoryId | 'all';
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  scenario?: ProductListScenario | null;
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
