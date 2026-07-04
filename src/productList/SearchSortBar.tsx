import type { ChangeEvent } from "react";
import type { Filters, SortBy } from "./types.ts";

type ViewMode = "grid" | "list";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
];

const isSortBy = (value: string): value is SortBy =>
  SORT_OPTIONS.some((opt) => opt.value === value);

const isViewMode = (value: string): value is ViewMode => value === "grid" || value === "list";

type SearchSortBarProps = {
  searchQuery: Filters["searchQuery"];
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  sortBy: Filters["sortBy"];
  onSortChange: (sortBy: SortBy) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
};

export function SearchSortBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: SearchSortBarProps) {
  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (isSortBy(value)) onSortChange(value);
  };

  const handleViewModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (isViewMode(value)) onViewModeChange(value);
  };

  return (
    <section className="search-sort">
      <input
        type="search"
        placeholder="상품 검색..."
        value={searchQuery}
        onChange={onSearchChange}
        className="search-input"
      />
      <select value={sortBy} onChange={handleSortChange}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select value={viewMode} onChange={handleViewModeChange}>
        <option value="grid">그리드</option>
        <option value="list">리스트</option>
      </select>
    </section>
  );
}

export type { ViewMode };
