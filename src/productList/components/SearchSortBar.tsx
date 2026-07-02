import type { ProductFiltersController } from "../hooks/useProductFilters";
import type { ViewMode } from "../types";
import { SORT_OPTIONS } from "../contants";

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
