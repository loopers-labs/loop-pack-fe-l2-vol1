import { useEffect, useState } from "react";
import type { Product } from "../types";
import { PAGE_SIZE } from "../constants";
import { fetchProducts, type ProductQuery } from "../services/productApi";

export const useProductList = (query: ProductQuery) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { category, minPrice, maxPrice, sortBy, searchQuery, page } = query;

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
        setProducts(data.products);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return { products, totalCount, totalPages, isLoading, error };
};
