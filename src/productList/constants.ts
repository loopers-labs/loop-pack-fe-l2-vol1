import type { CategoryFilter, SortBy, ViewMode } from "./types";

export const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "electronics", label: "전자제품" },
  { value: "fashion", label: "패션" },
  { value: "home", label: "홈" },
  { value: "beauty", label: "뷰티" },
];

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
];

export const PAGE_SIZE = 12;

export const isCategory = (value: string): value is CategoryFilter =>
  CATEGORIES.some((opt) => opt.value === value);

export const isSortBy = (value: string): value is SortBy =>
  SORT_OPTIONS.some((opt) => opt.value === value);

export const isViewMode = (value: string): value is ViewMode =>
  value === "grid" || value === "list";
