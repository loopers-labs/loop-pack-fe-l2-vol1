export const CATEGORY_IDS = ["casual", "fashion", "goods", "home", "digital"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORY_OPTIONS = ["all", ...CATEGORY_IDS] as const;
export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

export type Category = {
  id: CategoryId;
  name: string;
};

export const PRODUCT_SORTS = ["latest", "popular", "price-asc", "price-desc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export type ProductListQuery = {
  q?: string;
  category?: CategoryOption;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  scenario?: string;
};

export type SizeValue = { value: number; stock: number };

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: SizeValue[];
  rating: number;
  reviewCount: number;
  createdAt: string;
};

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};
