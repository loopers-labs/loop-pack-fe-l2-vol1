import type { Category, CategoryId, Product } from '@/entities/product/model/types';

export type MockApiScenario = "empty" | "error";

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  categoryThumbnails: Record<CategoryId, string>;
  popularProducts: Product[];
  newProducts: Product[];
};

export type ApiErrorResponse = {
  message: string;
};
