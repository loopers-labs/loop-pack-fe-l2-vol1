import { useEffect, useState } from "react";
import { fetchProductList, type ProductListParams } from "./api/productApi";
import type { Product } from "./types";

type Status = "idle" | "loading" | "success" | "error";

type UseProductListResult = {
  products: Product[];
  totalCount: number;
  status: Status;
  error: Error | null;
  refetch: () => void;
};

export function useProductList(params: ProductListParams): UseProductListResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      if (!ignore) {
        setStatus("loading");
        setError(null);
      }
      try {
        const data = await fetchProductList(params);
        if (!ignore) {
          setProducts(data.products);
          setTotalCount(data.totalCount);
          setStatus("success");
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [params, reloadKey]);

  const refetch = () => {
    setReloadKey((key) => key + 1);
  };

  return { products, totalCount, status, error, refetch };
}
