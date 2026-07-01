import type { SortBy, ViewMode } from "../types";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
];

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "grid", label: "그리드" },
  { value: "list", label: "리스트" },
];

function isSortBy(value: string): value is SortBy {
  return SORT_OPTIONS.some((option) => option.value === value);
}

function isViewMode(value: string): value is ViewMode {
  return VIEW_MODES.some((option) => option.value === value);
}

type ProductListToolbarProps = {
  searchQuery: string;
  sortBy: SortBy;
  viewMode: ViewMode;
  onSearchQueryChange: (query: string) => void;
  onSortChange: (sortBy: SortBy) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
};

export function ProductListToolbar({
  searchQuery,
  sortBy,
  viewMode,
  onSearchQueryChange,
  onSortChange,
  onViewModeChange,
}: ProductListToolbarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchQueryChange(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSortBy = e.target.value;

    if (isSortBy(nextSortBy)) {
      onSortChange(nextSortBy);
    }
  };

  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextViewMode = e.target.value;

    if (isViewMode(nextViewMode)) {
      onViewModeChange(nextViewMode);
    }
  };

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
      <select value={viewMode} onChange={handleViewModeChange}>
        {VIEW_MODES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </section>
  );
}
