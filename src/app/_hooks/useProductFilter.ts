'use client';

import { useSearchParams } from 'next/navigation';
import type { Product } from '@/types/product';
import type { Category } from '@/constants/category';

interface UseProductFilterResult {
  selectedCategory: Category;
  filterProducts: (products: Product[]) => Product[];
}

export function useProductFilter(): UseProductFilterResult {
  const searchParams = useSearchParams();
  const selectedCategory = (searchParams.get('category') ?? 'all') as Category;

  const filterProducts = (products: Product[]): Product[] => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category === selectedCategory);
  };

  return { selectedCategory, filterProducts };
}
