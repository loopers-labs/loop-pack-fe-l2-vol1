"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { QueryClient, QueryKey, UseQueryResult } from "@tanstack/react-query";
import type { ProductListResponse } from "../api/productApi";

type DisplayedProductListKeyStore = {
  getSnapshot: () => QueryKey | null;
  remember: (queryKey: QueryKey) => void;
  subscribe: (listener: () => void) => () => void;
};

type UseRetainedProductListDataOnRefreshErrorParams = {
  queryClient: QueryClient;
  queryKey: QueryKey;
  queryResult: UseQueryResult<ProductListResponse, Error>;
};

export function useRetainedProductListDataOnRefreshError({
  queryClient,
  queryKey,
  queryResult,
}: UseRetainedProductListDataOnRefreshErrorParams) {
  const displayedProductListKeyStore = useMemo(() => createDisplayedProductListKeyStore(), []);
  const lastDisplayedQueryKey = useSyncExternalStore(
    displayedProductListKeyStore.subscribe,
    displayedProductListKeyStore.getSnapshot,
    displayedProductListKeyStore.getSnapshot,
  );

  useEffect(() => {
    if (queryResult.status !== "success") {
      return;
    }

    if (queryResult.isPlaceholderData) {
      return;
    }

    displayedProductListKeyStore.remember(queryKey);
  }, [displayedProductListKeyStore, queryKey, queryResult.isPlaceholderData, queryResult.status]);

  if (queryResult.data !== undefined) {
    return queryResult.data;
  }

  if (queryResult.error === null || lastDisplayedQueryKey === null) {
    return undefined;
  }

  return queryClient.getQueryData<ProductListResponse>(lastDisplayedQueryKey);
}

function createDisplayedProductListKeyStore(): DisplayedProductListKeyStore {
  let displayedQueryKey: QueryKey | null = null;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => displayedQueryKey,
    remember: (queryKey) => {
      displayedQueryKey = queryKey;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
