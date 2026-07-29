import type { PRODUCT_SORTS } from "./constants";
import type { CategoryId } from "@/entities/category/@x/product";

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
  sizes: { value: number; stock: number }[];
  rating: number;
  reviewCount: number;
  createdAt: string;
};
