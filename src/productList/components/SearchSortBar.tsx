import type { ReactNode } from 'react';

import type { SortBy } from '../dto';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
];

interface SearchSortBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
  children: ReactNode;
}

/**
 * 검색과 Sort 컴포넌트
 * - 분리 기준: 서버 조회 파라미터를 결정하는 검색어와 정렬만 묶었습니다. viewMode는 서버로 가는 조회 조건이
 *   아닌 표시 상태라고 판단하여 props로 받지 않고 children으로 주입받게 하였습니다. props가 6개까지 늘어나는 것을
 *   children 합성으로 분리하였습니다.
 */
const SearchSortBar = ({ searchQuery, onSearchChange, sortBy, onSortChange, children }: SearchSortBarProps) => {
  return (
    <section className="search-sort">
      <input
        type="search"
        placeholder="상품 검색..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
      <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortBy)}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {children}
    </section>
  );
};

export default SearchSortBar;
