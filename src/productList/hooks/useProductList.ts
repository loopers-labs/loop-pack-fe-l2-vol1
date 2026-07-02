import { useEffect, useState } from "react";
import type { Product } from "../types";
import { fetchProducts, type ProductQuery } from "../services/productApi";

export const useProductList = (query: ProductQuery) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { category, minPrice, maxPrice, sortBy, searchQuery } = query;

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
        });
        setProducts(data.products);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [category, minPrice, maxPrice, sortBy, searchQuery]);

  return { products, isLoading, error };
};
