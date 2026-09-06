'use client';

import { useEffect, useRef } from 'react';
import type {
  Category,
  CategoryOption,
  ProductSort,
} from '@/entities/product/model/types';

interface ProductListFiltersProps {
  searchQuery?: string;
  category: CategoryOption;
  sort: ProductSort;
  categories: Category[];
  onSearchChange: (searchQuery: string) => void;
  onCategoryChange: (category: CategoryOption) => void;
  onSortChange: (sort: ProductSort) => void;
}

export function ProductListFilters({
  searchQuery,
  category,
  sort,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: ProductListFiltersProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current !== document.activeElement) {
      inputRef.current.value = searchQuery ?? '';
    }
  }, [searchQuery]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
    },
    [],
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  return (
    <div className="mt-8 flex flex-col gap-3 border-y border-border py-5 sm:flex-row sm:flex-wrap">
      <label className="min-w-0 flex-1 sm:min-w-64">
        <span className="sr-only">상품 검색</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="상품명 또는 브랜드"
          defaultValue={searchQuery}
          onChange={handleSearchChange}
          className="min-h-11 w-full rounded-lg border border-border bg-bg-card px-4 text-sm text-text outline-none transition-colors placeholder:text-text-caption focus:border-text"
        />
      </label>
      <label>
        <span className="sr-only">카테고리</span>
        <select
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value as CategoryOption)
          }
          className="min-h-11 w-full rounded-lg border border-border bg-bg-card px-4 text-sm text-text outline-none transition-colors focus:border-text sm:w-auto"
        >
          <option value="all">전체</option>
          {categories.map((categoryOption) => (
            <option key={categoryOption.id} value={categoryOption.id}>
              {categoryOption.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">정렬</span>
        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as ProductSort)
          }
          className="min-h-11 w-full rounded-lg border border-border bg-bg-card px-4 text-sm text-text outline-none transition-colors focus:border-text sm:w-auto"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
          <option value="price-asc">가격 낮은순</option>
          <option value="price-desc">가격 높은순</option>
        </select>
      </label>
    </div>
  );
}
