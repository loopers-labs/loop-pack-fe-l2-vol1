import type { ProductFiltersController } from "../hooks/useProductFilters";
import type { SortBy, ViewMode } from "../types";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
];

interface SearchSortBarProps {
  filters: ProductFiltersController;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SearchSortBar({
  filters,
  viewMode,
  onViewModeChange,
}: SearchSortBarProps) {
  const { searchQuery, sortBy, handleSearchChange, handleSortChange } = filters;

  return (
    <section className="search-sort">
      <input
        type="search"
        placeholder="상품 검색..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-input"
      />
      <select value={sortBy} onChange={handleSortChange}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={viewMode}
        onChange={(e) => onViewModeChange(e.target.value as ViewMode)}
      >
        <option value="grid">그리드</option>
        <option value="list">리스트</option>
      </select>
    </section>
  );
}
