'use client';

import {
  CATEGORY_FILTER_LABEL,
  CATEGORY_FILTERS,
  PRODUCT_SORT_LABEL,
  type CategoryFilter,
} from './constants';
import { useProductListUrlState } from './search-params';

import { PRODUCT_SORTS, type ProductSort } from '@/types/commerce';

export function ProductListFilters() {
  const {
    conditions: { category, sort },
    changeCategory,
    changeSort,
  } = useProductListUrlState();

  return (
    <div className="week05-filters">
      <label>
        카테고리
        <select
          value={category}
          onChange={(event) => {
            changeCategory(event.target.value as CategoryFilter);
          }}
        >
          {CATEGORY_FILTERS.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_FILTER_LABEL[value]}
            </option>
          ))}
        </select>
      </label>
      <label>
        정렬
        <select
          value={sort}
          onChange={(event) => {
            changeSort(event.target.value as ProductSort);
          }}
        >
          {PRODUCT_SORTS.map((value) => (
            <option key={value} value={value}>
              {PRODUCT_SORT_LABEL[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
