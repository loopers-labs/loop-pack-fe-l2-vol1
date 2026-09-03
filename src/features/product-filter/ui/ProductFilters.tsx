import { useEffect, useRef, useState } from 'react';
import type { CategoryId } from '@/entities/category/model/category';
import type { ProductListQuery, ProductSort } from '@/entities/product/model/product';

const SEARCH_DEBOUNCE_MS = 300;

type ProductFiltersProps = {
  /** 현재 적용된 검색어/카테고리/정렬 */
  filters: Pick<ProductListQuery, 'q' | 'category' | 'sort'>;
  /** 검색 폼 제출 시 호출 */
  onSearch: (q: string) => void;
  /** 카테고리 변경 시 호출 */
  onCategoryChange: (category: CategoryId | 'all') => void;
  /** 정렬 변경 시 호출 */
  onSortChange: (sort: ProductSort) => void;
  /** 검색·카테고리·정렬 조건 전체 초기화 시 호출 */
  onReset: () => void;
};

const CATEGORY_OPTIONS: { value: CategoryId | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'casual', label: '캐주얼' },
  { value: 'fashion', label: '패션' },
  { value: 'goods', label: '뷰티·잡화' },
  { value: 'home', label: '홈' },
  { value: 'digital', label: '디지털' },
];

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
];

/* AI-generated : week06-advanced-b.md 2단계 기준 */
export function ProductFilters({
  filters,
  onSearch,
  onCategoryChange,
  onSortChange,
  onReset,
}: ProductFiltersProps) {
  const appliedQuery = filters.q ?? '';
  const [prevAppliedQuery, setPrevAppliedQuery] = useState(appliedQuery);
  const [draftQuery, setDraftQuery] = useState(appliedQuery);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  if (appliedQuery !== prevAppliedQuery) {
    setPrevAppliedQuery(appliedQuery);
    setDraftQuery(appliedQuery);
  }

  useEffect(() => {
    if (draftQuery === appliedQuery) return;

    const timer = setTimeout(() => {
      onSearchRef.current(draftQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draftQuery, appliedQuery]);

  return (
    <form
      className="week05-filters"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draftQuery);
      }}
    >
      <label>
        검색
        <input
          name="q"
          placeholder="상품명 또는 브랜드"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
      </label>
      <label>
        카테고리
        <select
          name="category"
          value={filters.category ?? 'all'}
          onChange={(event) => onCategoryChange(event.target.value as CategoryId | 'all')}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        정렬
        <select
          name="sort"
          value={filters.sort ?? 'latest'}
          onChange={(event) => onSortChange(event.target.value as ProductSort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button className="week05-button" type="button" onClick={onReset}>
        초기화
      </button>
    </form>
  );
}
