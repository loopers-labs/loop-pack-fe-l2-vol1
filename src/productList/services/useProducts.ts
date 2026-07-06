import { useEffect, useState } from 'react';
import type { Product, ProductParams } from '../shared';
import { getProducts } from '../repository/getProducts';
import { setUrlSearchParams } from '../utils/urlSearchParams';

export const useProducts = (params: ProductParams) => {
  // ─── 서버 상태 (직접 관리) ──────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { category, minPrice, maxPrice, sortBy, searchQuery, page, itemsPerPage, inStockOnly } =
    params;

  useEffect(() => {
    let ignore = false;
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
        if (!ignore) {
          setProducts(res.products);
          setTotalCount(res.totalCount);
        }
      } catch (err) {
        if (!ignore) {
          // AI로 as 타입 단언 해결
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };
    fetchProducts();

    return () => {
      ignore = true;
    };
  }, [
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    itemsPerPage,
    inStockOnly,
    retryCount,
  ]);

  return { products, totalCount, isLoading, error, setRetryCount };
};
