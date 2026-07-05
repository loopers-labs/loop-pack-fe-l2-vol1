import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '../services/productApi';
import type { ProductListParams } from '../services/productApi';
import type { ProductListResponse } from '../types/product';

type UseProductsResult = {
  data: ProductListResponse | null;
  isPending: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useProducts(params: ProductListParams): UseProductsResult {
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // 같은 파라미터로 다시 요청하기 위한 트리거 (일시적 오류 후 재시도용)
  const [reloadKey, setReloadKey] = useState(0);

  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
  } = params;

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setIsPending(true);
      setError(null);
      try {
        const res = await getProducts({
          category,
          minPrice,
          maxPrice,
          sortBy,
          searchQuery,
          page,
          inStockOnly,
        });
        if (!ignore) setData(res);
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err
              : new Error('상품을 불러오지 못했습니다.'),
          );
        }
      } finally {
        if (!ignore) setIsPending(false);
      }
    };

    void run();

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
    inStockOnly,
    reloadKey,
  ]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { data, isPending, error, refetch };
}
