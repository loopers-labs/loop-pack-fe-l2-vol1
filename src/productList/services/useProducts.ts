import { useEffect, useState } from 'react';
import type { Product, ProductParams } from '../shared';
import { getProducts } from '../repository/getProducts';
import { setUrlSearchParams } from '../utils/setUrlSearchParams';

export const useProducts = (params: ProductParams) => {
  // ─── 서버 상태 (직접 관리) ──────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { category, minPrice, maxPrice, sortBy, searchQuery, page, itemsPerPage, inStockOnly } =
    params;

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await getProducts(
          setUrlSearchParams({
            category,
            minPrice,
            maxPrice,
            sortBy,
            searchQuery,
            page,
            itemsPerPage,
            inStockOnly,
          })
        );
        setProducts(res.products);
        setTotalCount(res.totalCount);
      } catch (err) {
        // AI로 as 타입 단언 해결
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page, itemsPerPage, inStockOnly]);

  return { products, totalCount, isLoading, error };
};
