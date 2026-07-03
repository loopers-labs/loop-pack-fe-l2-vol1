import { useEffect, useState } from "react";
import { fetchProducts, type ProductQueryParams } from "../services/productApi";
import type { Product } from "../types";

type UseProductsParams = ProductQueryParams & {
  // inStock은 서버가 아니라 "받아온 페이지 안에서" 거르는 기존 동작을 유지한다(README 참고).
  inStockOnly: boolean;
};

type UseProductsResult = {
  products: Product[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
};

// 필터 조건에 맞는 상품 목록을 서버에서 가져오고 로딩·에러 상태를 관리한다(서버 상태).
export function useProducts(params: UseProductsParams): UseProductsResult {
  const { category, minPrice, maxPrice, sortBy, searchQuery, page, inStockOnly } = params;

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
        });
        const filtered = inStockOnly ? data.products.filter((p) => p.stock > 0) : data.products;
        setProducts(filtered);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page, inStockOnly]);

  return { products, totalCount, isLoading, error };
}
