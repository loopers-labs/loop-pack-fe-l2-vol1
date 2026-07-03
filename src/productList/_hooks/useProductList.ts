import { useState, useEffect } from 'react';
import { fetchProducts } from '../_services/productService';
import { PAGE_SIZE } from '../types';
import type { Product } from '../types';

type Params = {
  category: string;
  minPrice: number | '';
  maxPrice: number | '';
  sortBy: string;
  searchQuery: string;
  page: number;
  inStockOnly: boolean;
};

export function useProductList({
  category,
  minPrice,
  maxPrice,
  sortBy,
  searchQuery,
  page,
  inStockOnly,
}: Params) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 필터가 바뀌거나 retryCount가 증가하면 서버에서 상품 목록을 가져옴
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProducts({
          category,
          minPrice,
          maxPrice,
          sortBy,
          searchQuery,
          page,
          pageSize: PAGE_SIZE,
        });
        const filtered = inStockOnly
          ? data.products.filter((p) => p.stock > 0)
          : data.products;
        setProducts(filtered);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
    retryCount,
  ]);

  // 페이지가 바뀔 때 스크롤 맨 위로 (브라우저 외부 시스템 동기화)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const refetch = () => setRetryCount((c) => c + 1);

  return { products, totalCount, isLoading, error, refetch };
}
