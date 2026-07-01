import { useCallback, useEffect, useReducer, useRef } from "react";
import { getProducts, type GetProductsParams } from "../services/productService";
import type { ProductListResponse } from "../types";

type UseProductListParams = GetProductsParams & {
  inStockOnly: boolean;
};

type ProductListState = {
  data: ProductListResponse | null;
  isLoading: boolean;
  error: Error | null;
};

type ProductListAction =
  | { type: "request" }
  | { type: "success"; payload: ProductListResponse }
  | { type: "failure"; payload: Error };

const initialState: ProductListState = {
  data: null,
  isLoading: false,
  error: null,
};

function productListReducer(state: ProductListState, action: ProductListAction): ProductListState {
  switch (action.type) {
    case "request":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "success":
      return {
        data: action.payload,
        isLoading: false,
        error: null,
      };
    case "failure":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
  }
}

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
  const [{ data, isLoading, error }, dispatch] = useReducer(productListReducer, initialState);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const fetchProducts = useCallback(async () => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    dispatch({ type: "request" });

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

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      const products = inStockOnly
        ? response.products.filter((product) => product.stock > 0)
        : response.products;

      dispatch({
        type: "success",
        payload: {
          ...response,
          products,
        },
      });
    } catch (err) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      dispatch({
        type: "failure",
        payload: err instanceof Error ? err : new Error("상품 목록을 불러오지 못했습니다."),
      });
    }
  }, [category, q, page, sort, minPrice, maxPrice, size, inStockOnly]);

  useEffect(() => {
    fetchProducts();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchProducts]);

  return {
    products: data?.products ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}
