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
