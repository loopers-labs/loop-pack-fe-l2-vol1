import { useState } from "react";
import { isSortBy, isViewMode } from "../constants";
import type { CategoryFilter, ProductFilters, ProductQuery } from "../types";
import { useDebouncedValue } from "./useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * 상품 목록의 필터·검색·정렬·페이지·옵션 클라이언트 상태와 그 변경 핸들러를 관리한다.
 * 서버 조회에 필요한 부분만 추린 `query`(파생값)도 함께 제공한다.
 */
export function useProductFilters() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<ProductFilters["sortBy"]>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ProductFilters["viewMode"]>("grid");

  const handleCategoryChange = (next: CategoryFilter) => {
    setCategory(next);
    setPage(1);
  };

  const handleMinPriceChange = (value: number | "") => {
    setMinPrice(value);
    setPage(1);
  };

  const handleMaxPriceChange = (value: number | "") => {
    setMaxPrice(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    if (isSortBy(value)) setSortBy(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleInStockToggle = (next: boolean) => {
    setInStockOnly(next);
    setPage(1);
  };

  const handleViewModeChange = (value: string) => {
    if (isViewMode(value)) setViewMode(value);
  };

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

  const filters: ProductFilters = {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
    viewMode,
  };

  // 입력이 매 키스트로크마다 요청을 유발하지 않도록 네트워크로 가는 값만 디바운스한다.
  // 카테고리·정렬·페이지는 단발 조작이라 즉시 반영한다.
  const debouncedSearchQuery = useDebouncedValue(
    searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedMinPrice = useDebouncedValue(minPrice, SEARCH_DEBOUNCE_MS);
  const debouncedMaxPrice = useDebouncedValue(maxPrice, SEARCH_DEBOUNCE_MS);

  // 서버로 보낼 조회 조건 — inStockOnly·viewMode 같은 클라이언트 전용 값은 뺀다.
  const query: ProductQuery = {
    category,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    sortBy,
    searchQuery: debouncedSearchQuery,
    page,
  };

  return {
    filters,
    query,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handleViewModeChange,
    handlePageChange,
    handleResetFilters,
  };
}
