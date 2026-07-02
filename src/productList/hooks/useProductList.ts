import { useEffect, useState } from "react";
import type { Product, ProductListResponse, SortBy } from "../types";
import { PAGE_SIZE } from "../constants";

type ProductFilters = {
  category: "all" | Product["category"];
  minPrice: number | "";
  maxPrice: number | "";
  sortBy: SortBy;
  searchQuery: string;
  page: number;
};

export const useProductList = (filters: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { category, minPrice, maxPrice, sortBy, searchQuery, page } = filters;

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        category,
        sort: sortBy,
        q: searchQuery,
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (minPrice !== "") params.set("minPrice", String(minPrice));
      if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
        const data: ProductListResponse = await res.json();
        setProducts(data.products);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page]);

  return { products, totalCount, isLoading, error };
};
