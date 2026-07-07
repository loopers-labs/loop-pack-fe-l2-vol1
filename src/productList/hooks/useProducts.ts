import { useEffect, useState } from "react";
import { fetchProducts } from "../services/productApi";
import { PAGE_SIZE } from "../constants";
import type { FilterState, Product } from "../types";

type UseProductsResult = {
  products: Product[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
};

// 필터 조건에 맞는 상품 목록을 서버에서 가져오고 로딩·에러 상태를 관리한다(서버 상태).
// page가 응답 범위를 벗어나면(예: ?page=99) onPageOutOfRange로 마지막 페이지로 보정을 요청한다.
export function useProducts(
  query: FilterState,
  onPageOutOfRange: (lastPage: number) => void,
): UseProductsResult {
  const { category, minPrice, maxPrice, sortBy, searchQuery, page, inStockOnly } = query;

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
        // 서버 원본만 저장한다. inStock 필터는 파생값이라 state로 들지 않는다.
        setProducts(data.products);
        setTotalCount(data.totalCount);
        // 요청 page가 실제 페이지 수를 넘으면 마지막 페이지로 보정(빈 화면 방지).
        const lastPage = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE));
        if (page > lastPage) {
          onPageOutOfRange(lastPage);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page, onPageOutOfRange]);

  // 파생값 → 렌더 중 계산. inStockOnly 토글은 서버 재요청 없이 즉시 반영된다.
  const visibleProducts = inStockOnly ? products.filter((p) => p.stock > 0) : products;

  return { products: visibleProducts, totalCount, isLoading, error };
}
