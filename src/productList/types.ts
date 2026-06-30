export const PRODUCT_CATEGORIES = [
  'electronics',
  'fashion',
  'home',
  'beauty',
] as const;

export const CATEGORY_FILTER_VALUES = ['all', ...PRODUCT_CATEGORIES] as const;

export const SORT_VALUES = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const;

export type Category = (typeof PRODUCT_CATEGORIES)[number];
export type CategoryFilter = (typeof CATEGORY_FILTER_VALUES)[number];
export type SortBy = (typeof SORT_VALUES)[number];

export type Product = {
  id: number;
  name: string;
  category: Category;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
};
