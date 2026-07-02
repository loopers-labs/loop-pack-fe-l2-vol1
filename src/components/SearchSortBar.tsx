import type { SortBy } from '../types/product';
import type { ProductFilters } from '../hooks/useProductFilters';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
];

type Props = {
  filters: ProductFilters;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
};

export function SearchSortBar({ filters, viewMode, onViewModeChange }: Props) {
  const { values, setSearchQuery, setSortBy } = filters;

  return (
    <section className="search-sort">
      <input
        type="search"
        placeholder="상품 검색..."
        value={values.searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      <select
        value={values.sortBy}
        onChange={(e) => {
          const next = SORT_OPTIONS.find((o) => o.value === e.target.value);
          if (next) setSortBy(next.value);
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={viewMode}
        onChange={(e) =>
          onViewModeChange(e.target.value === 'list' ? 'list' : 'grid')
        }
      >
        <option value="grid">그리드</option>
        <option value="list">리스트</option>
      </select>
    </section>
  );
}
