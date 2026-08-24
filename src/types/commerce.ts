import type {
  Category,
  CategoryId,
  Product,
} from '@/entities/product/model/types';

export type MockApiScenario = 'empty' | 'error' | 'slow';

export type ApiErrorResponse = {
  message: string;
};

export type HomeResponse = {
  banner: {
    title: string;
    description: string;
    image: string;
  };
  categories: Category[];
  categoryThumbnails: Record<CategoryId, string>;
  popularProducts: Product[];
  newProducts: Product[];
};
