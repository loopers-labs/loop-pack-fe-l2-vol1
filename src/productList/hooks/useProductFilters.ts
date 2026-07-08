import { useEffect, useState } from "react";
import type { SortBy } from "../types";
import {
  buildFilterSearchParams,
  pushFiltersToUrl,
  readFiltersFromUrl,
  type CategoryValue,
  type ProductFilterState,
} from "../utils/filterParams";
import { useDebounced } from "./useDebounced";

export const useProductFilters = () => {
  const initial = readFiltersFromUrl();
  const [category, setCategory] = useState<CategoryValue>(initial.category);
  const [minPrice, setMinPrice] = useState(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice);
  const [sortBy, setSortBy] = useState<SortBy>(initial.sortBy);
  const [searchQuery, setSearchQuery] = useState(initial.searchQuery);
  const [page, setPage] = useState(initial.page);
  const [inStockOnly, setInStockOnly] = useState(initial.inStockOnly);
  const debouncedMinPrice = useDebounced(minPrice);
  const debouncedMaxPrice = useDebounced(maxPrice);
  const debouncedSearchQuery = useDebounced(searchQuery);

  useEffect(() => {
    const settled =
      debouncedMinPrice === minPrice &&
      debouncedMaxPrice === maxPrice &&
      debouncedSearchQuery === searchQuery;
    if (!settled) return;

    const filters: ProductFilterState = {
      category,
      minPrice: debouncedMinPrice,
      maxPrice: debouncedMaxPrice,
      sortBy,
      searchQuery: debouncedSearchQuery,
      page,
      inStockOnly,
    };
    const next = buildFilterSearchParams(filters);
    if (next === buildFilterSearchParams(readFiltersFromUrl())) return;
    pushFiltersToUrl(filters);
  }, [
    category,
    sortBy,
    page,
    inStockOnly,
    minPrice,
    maxPrice,
    searchQuery,
    debouncedMinPrice,
    debouncedMaxPrice,
    debouncedSearchQuery,
  ]);

  useEffect(() => {
    const handlePopState = (): void => {
      const parsed = readFiltersFromUrl();
      setCategory(parsed.category);
      setMinPrice(parsed.minPrice);
      setMaxPrice(parsed.maxPrice);
      setSortBy(parsed.sortBy);
      setSearchQuery(parsed.searchQuery);
      setInStockOnly(parsed.inStockOnly);
      setPage(parsed.page);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const withPageReset =
    <Args extends unknown[]>(handler: (...args: Args) => void) =>
    (...args: Args) => {
      handler(...args);
      setPage(1);
    };

  const handleCategoryChange = withPageReset((cat: CategoryValue) =>
    setCategory(cat),
  );

  const handleMinPriceChange = withPageReset(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setMinPrice(v === "" ? "" : Number(v));
    },
  );

  const handleMaxPriceChange = withPageReset(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setMaxPrice(v === "" ? "" : Number(v));
    },
  );

  const handleSortChange = withPageReset(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setSortBy(e.target.value as SortBy),
  );

  const handleSearchChange = withPageReset(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
  );

  const handleInStockToggle = withPageReset(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setInStockOnly(e.target.checked),
  );

  const handlePageChange = (next: number) => {
    setPage(next);
  };

  const handleResetFilters = () => {
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("latest");
    setSearchQuery("");
    setInStockOnly(false);
    setPage(1);
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
