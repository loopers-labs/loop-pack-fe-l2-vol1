import { useState, useEffect } from 'react';
import { fetchProducts, type Product } from '../_services/productService';

type Params = {
  category: string;
  minPrice: number | '';
  maxPrice: number | '';
  sortBy: string;
  searchQuery: string;
  page: number;
  inStockOnly: boolean;
};

const PAGE_SIZE = 12;

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

  // 필터가 바뀔 때마다 서버에서 상품 목록을 가져옴 (서버 상태 동기화)
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
        // 클라이언트에서 추가 필터링 — "재고 있는 것만" 토글
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
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page, inStockOnly]);

  // 페이지가 바뀔 때 스크롤 맨 위로 (브라우저 외부 시스템 동기화)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  return { products, totalCount, isLoading, error };
}
