"use client";

import { ProductSearchInput } from "@/app/products/_components/product-search-input";
import {
  categoryFilterOptions,
  pageSizeValues,
  type ProductSearchState,
} from "@/app/products/_lib/search-params";

type ProductFiltersProps = {
  search: ProductSearchState;
  onChange: (patch: Partial<ProductSearchState>) => void;
};

export function ProductFilters({ search, onChange }: ProductFiltersProps) {
  return (
    <div className="week05-filters">
      <ProductSearchInput value={search.q} onDebouncedChange={(q) => onChange({ q, page: 1 })} />
      <label>
        카테고리
        <select
          name="category"
          value={search.category}
          onChange={(event) =>
            onChange({
              category: event.target.value as ProductSearchState["category"],
              page: 1,
            })
          }
        >
          {categoryFilterOptions.map((option) => (
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
          value={search.sort}
          onChange={(event) =>
            onChange({
              sort: event.target.value as ProductSearchState["sort"],
              page: 1,
            })
          }
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
          <option value="price-asc">낮은 가격순</option>
          <option value="price-desc">높은 가격순</option>
        </select>
      </label>
      <label>
        페이지 크기
        <select
          name="pageSize"
          value={search.pageSize}
          onChange={(event) =>
            onChange({
              pageSize: Number(event.target.value) as ProductSearchState["pageSize"],
              page: 1,
            })
          }
        >
          {pageSizeValues.map((size) => (
            <option key={size} value={size}>
              {size}개씩
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
