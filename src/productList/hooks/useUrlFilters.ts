import { useMemo, useSyncExternalStore } from "react";
import {
  URL_FILTERS_CHANGED_EVENT,
  parseFilterSearch,
  type ProductFilterState,
} from "../utils/filterParams";

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_FILTERS_CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_FILTERS_CHANGED_EVENT, onChange);
  };
};

const getSnapshot = (): string => window.location.search;

const getServerSnapshot = (): string => "";

export const useUrlFilters = (): ProductFilterState => {
  const search = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return useMemo(() => parseFilterSearch(search), [search]);
};
