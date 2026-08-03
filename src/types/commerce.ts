import type { Category, Product } from '@/entities/product/model';

export type MockApiScenario = "empty" | "error";

export type ApiErrorResponse = {
  message: string;
};

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};
