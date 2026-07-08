import { useEffect, useRef, useState } from "react";
import type { SortBy } from "../types";
import {
  commitFiltersToUrl,
  type CategoryValue,
  type ProductFilterState,
} from "../utils/filterParams";
import { useUrlFilters } from "./useUrlFilters";
import { useDebounced } from "./useDebounced";

export const useProductFilters = () => {
  const urlFilters = useUrlFilters();
  const { category, sortBy, page, inStockOnly } = urlFilters;

  const [searchQuery, setSearchQuery] = useState(urlFilters.searchQuery);
  const [minPrice, setMinPrice] = useState(urlFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(urlFilters.maxPrice);
  const debouncedSearchQuery = useDebounced(searchQuery);
  const debouncedMinPrice = useDebounced(minPrice);
  const debouncedMaxPrice = useDebounced(maxPrice);

  const urlFiltersRef = useRef(urlFilters);
  urlFiltersRef.current = urlFilters;

  useEffect(() => {
    setSearchQuery(urlFilters.searchQuery);
    setMinPrice(urlFilters.minPrice);
    setMaxPrice(urlFilters.maxPrice);
  }, [urlFilters.searchQuery, urlFilters.minPrice, urlFilters.maxPrice]);

  useEffect(() => {
    const current = urlFiltersRef.current;
    if (
      debouncedSearchQuery === current.searchQuery &&
      debouncedMinPrice === current.minPrice &&
      debouncedMaxPrice === current.maxPrice
    ) {
      return;
    }
    commitFiltersToUrl(
      {
        ...current,
        searchQuery: debouncedSearchQuery,
        minPrice: debouncedMinPrice,
        maxPrice: debouncedMaxPrice,
        page: 1,
      },
      "replace",
    );
  }, [debouncedSearchQuery, debouncedMinPrice, debouncedMaxPrice]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const commitPatch = (patch: Partial<ProductFilterState>): void => {
    commitFiltersToUrl({ ...urlFilters, page: 1, ...patch }, "push");
  };

  const handleCategoryChange = (cat: CategoryValue): void =>
    commitPatch({ category: cat });

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>): void =>
    commitPatch({ sortBy: e.target.value as SortBy });

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>): void =>
    commitPatch({ inStockOnly: e.target.checked });

  const handleMinPriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const v = e.target.value;
    setMinPrice(v === "" ? "" : Number(v));
  };

  const handleMaxPriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const v = e.target.value;
    setMaxPrice(v === "" ? "" : Number(v));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void =>
    setSearchQuery(e.target.value);

  const handlePageChange = (next: number): void => {
    commitFiltersToUrl({ ...urlFilters, page: next }, "push");
  };

  const handleResetFilters = (): void => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    commitFiltersToUrl(
      {
        category: "all",
        minPrice: "",
        maxPrice: "",
        sortBy: "latest",
        searchQuery: "",
        page: 1,
        inStockOnly: false,
      },
      "push",
    );
  };

  return {
    category,
    minPrice,
    maxPrice,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy,
    searchQuery,
    debouncedSearchQuery,
    page,
    inStockOnly,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handlePageChange,
    handleResetFilters,
  };
};

export type ProductFiltersController = ReturnType<typeof useProductFilters>;
