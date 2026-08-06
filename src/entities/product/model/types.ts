import type { PRODUCT_CATEGORY_IDS, PRODUCT_SORTS } from "./constants";

export type ProductCategoryId = (typeof PRODUCT_CATEGORY_IDS)[number];
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: ProductCategoryId;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: { value: number; stock: number }[];
  rating: number;
  reviewCount: number;
  createdAt: string;
};
