'use client';

import { useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/constants/category';
import type { Product } from '@/types/product';
import type { Category } from '@/constants/category';

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.key));

function isCategory(value: string): value is Category {
  return VALID_CATEGORIES.has(value);
}

interface UseProductFilterResult {
  selectedCategory: Category;
  filterProducts: (products: Product[]) => Product[];
}

export function useProductFilter(): UseProductFilterResult {
  const searchParams = useSearchParams();
  const raw = searchParams.get('category') ?? 'all';
  const selectedCategory: Category = isCategory(raw) ? raw : 'all';

  const filterProducts = (products: Product[]): Product[] => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category === selectedCategory);
  };

  return { selectedCategory, filterProducts };
}
