import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  getProducts,
  type GetProductsParams,
  type GetProductsResponse,
} from "../services/productService";

type ProductListState = {
  data: GetProductsResponse | null;
  isLoading: boolean;
  error: Error | null;
};

type ProductListAction =
  | { type: "request" }
  | { type: "success"; payload: GetProductsResponse }
  | { type: "failure"; payload: Error };

const initialState: ProductListState = {
  data: null,
  isLoading: false,
  error: null,
};

function productListReducer(state: ProductListState, action: ProductListAction): ProductListState {
  if (action.type === "request") {
    return {
      ...state,
      isLoading: true,
      error: null,
    };
  }

  if (action.type === "success") {
    return {
      data: action.payload,
      isLoading: false,
      error: null,
    };
  }

  if (action.type === "failure") {
    return {
      ...state,
      isLoading: false,
      error: action.payload,
    };
  }

  return state;
}

export function useProductListQuery({
  category,
  q,
  page,
  sort,
  minPrice,
  maxPrice,
  size,
  inStockOnly,
}: GetProductsParams) {
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
          inStockOnly,
        },
        {
          signal: controller.signal,
        },
      );

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      dispatch({
        type: "success",
        payload: response,
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

  const products = data?.products ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasProducts = products.length > 0;

  return {
    products,
    totalCount,
    isInitialLoading: isLoading && !hasProducts,
    isBackgroundLoading: isLoading && hasProducts,
    error,
    refetch: fetchProducts,
  };
}
