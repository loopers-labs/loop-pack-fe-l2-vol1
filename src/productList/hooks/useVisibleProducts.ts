import { useMemo } from "react";
import type { Product } from "../types";
import { PAGE_SIZE } from "../constants";
import { paginate } from "../utils/pagination";

type Params = {
  products: Product[];
  inStockOnly: boolean;
  page: number;
};

export const useVisibleProducts = ({ products, inStockOnly, page }: Params) => {
  return useMemo(() => {
    const filtered = inStockOnly
      ? products.filter((p) => p.stock > 0)
      : products;
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const visibleProducts = paginate(filtered, page, PAGE_SIZE);

    return { visibleProducts, totalCount, totalPages };
  }, [products, inStockOnly, page]);
};
