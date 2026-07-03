import { useState } from "react";
import type { CategoryFilter, SortBy } from "../types";

// 목록을 거르는 조건과 현재 페이지를 관리하고, 조건이 바뀌면 페이지를 1로 되돌린다.
// (DOM 이벤트가 아니라 "값"만 받는다 — 이벤트 → 값 변환은 컴포넌트의 책임)
export function useProductFilters() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const selectCategory = (next: CategoryFilter) => {
    setCategory(next);
    setPage(1);
  };
  const changeMinPrice = (next: number | "") => {
    setMinPrice(next);
    setPage(1);
  };
  const changeMaxPrice = (next: number | "") => {
    setMaxPrice(next);
    setPage(1);
  };
  const selectSort = (next: SortBy) => {
    setSortBy(next);
    setPage(1);
  };
  const search = (next: string) => {
    setSearchQuery(next);
    setPage(1);
  };
  const toggleInStock = (next: boolean) => {
    setInStockOnly(next);
    setPage(1);
  };
  const goToPage = (next: number) => {
    setPage(next);
  };
  const reset = () => {
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
    sortBy,
    searchQuery,
    inStockOnly,
    page,
    selectCategory,
    changeMinPrice,
    changeMaxPrice,
    selectSort,
    search,
    toggleInStock,
    goToPage,
    reset,
  };
}
