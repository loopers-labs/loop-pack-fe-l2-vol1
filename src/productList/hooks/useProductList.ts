import { useEffect, useState } from "react";
import { getProducts, type GetProductsParams } from "../services/productService";
import type { ProductListResponse } from "../types";

type UseProductListParams = GetProductsParams & {
  inStockOnly: boolean;
};

export function useProductList({
  category,
  q,
  page,
  sort,
  minPrice,
  maxPrice,
  size,
  inStockOnly,
}: UseProductListParams) {
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getProducts(
          {
            category,
            q,
            page,
            sort,
            minPrice,
            maxPrice,
            size,
          },
          {
            signal: controller.signal,
          },
        );

        if (ignore) {
          return;
        }

        const products = inStockOnly
          ? response.products.filter((product) => product.stock > 0)
          : response.products;

        setData({
          ...response,
          products,
        });
      } catch (err) {
        if (ignore) {
          return;
        }

        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err : new Error("상품 목록을 불러오지 못했습니다."));
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [category, q, page, sort, minPrice, maxPrice, size, inStockOnly]);

  return {
    products: data?.products ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
  };
}
