import { useState, useEffect } from 'react';
import type { Product, ProductListParams } from '../type';
import { fetchProducts } from '../services/productService';

export function useProductList({
  category,
  sortBy,
  searchQuery,
  page,
  minPrice,
  maxPrice,
  inStockOnly,
}: ProductListParams) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProducts({
          category,
          sortBy,
          searchQuery,
          page,
          minPrice,
          maxPrice,
          inStockOnly,
        });
        if (!ignore) {
          setProducts(data.products);
          setTotalCount(data.totalCount);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [category, sortBy, searchQuery, page, minPrice, maxPrice, inStockOnly]);

  return { products, totalCount, isLoading, error };
}
