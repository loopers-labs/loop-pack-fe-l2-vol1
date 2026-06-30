import { useEffect, useState } from "react";
import { fetchProducts } from "../services/productApi";
import type { Product, ProductQuery } from "../types";

/**
 * 상품 목록 서버 상태(데이터·로딩·에러)를 조회 조건에 맞춰 가져온다.
 * cleanup 의 `ignore` 플래그로 늦게 도착한 stale 응답이 최신 상태를 덮어쓰지 못하게 막는다.
 */
export function useProducts(query: ProductQuery) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 의존성은 query 객체가 아니라 원시 필드로 푼다 — 객체를 그대로 두면 매 렌더 새 참조라 무한 요청.
  const { category, minPrice, maxPrice, sortBy, searchQuery, page } = query;

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
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
        if (ignore) return;
        setProducts(data.products);
        setTotalCount(data.totalCount);
      } catch (err) {
        if (ignore) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page]);

  return { products, totalCount, isLoading, error };
}
