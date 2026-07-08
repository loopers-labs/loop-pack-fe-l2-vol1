import { useEffect, useState } from "react";
import { fetchProducts, type ProductQuery } from "../services/productApi";
import type { Product } from "../types";

export const useProductList = (query: ProductQuery) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const { category, minPrice, maxPrice, sortBy, searchQuery } = query;

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProducts(
          {
            category,
            minPrice,
            maxPrice,
            sortBy,
            searchQuery,
          },
          controller.signal,
        );
        if (ignore) return;
        setProducts(data.products);
      } catch (err) {
        if (ignore || (err as Error).name === "AbortError") return;
        setError(err as Error);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [category, minPrice, maxPrice, sortBy, searchQuery, retryToken]);

  const refetch = () => setRetryToken((n) => n + 1);

  return { products, isLoading, error, refetch };
};
