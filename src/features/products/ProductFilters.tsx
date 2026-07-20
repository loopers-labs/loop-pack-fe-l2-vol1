import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import type { ProductCategoryFilter, ProductSort } from "./types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const SEARCH_DEBOUNCE_DELAY_MS = 300;

const CATEGORY_OPTIONS: Array<{ value: ProductCategoryFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "casual", label: "캐주얼" },
  { value: "fashion", label: "패션" },
  { value: "goods", label: "뷰티·잡화" },
  { value: "home", label: "홈" },
  { value: "digital", label: "디지털" },
];

const SORT_OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-asc", label: "낮은 가격순" },
  { value: "price-desc", label: "높은 가격순" },
];

type ProductFiltersProps = {
  q: string;
  category: ProductCategoryFilter;
  sort: ProductSort;
  onSearchChange: (q: string) => void;
  onCategoryChange: (category: ProductCategoryFilter) => void;
  onSortChange: (sort: ProductSort) => void;
  onReset: () => void;
};

export function ProductFilters({
  q,
  category,
  sort,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onReset,
}: ProductFiltersProps) {
  const [draftQ, setDraftQ] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  const debouncedQ = useDebouncedValue(draftQ, SEARCH_DEBOUNCE_DELAY_MS);

  if (q !== prevQ) {
    setPrevQ(q);
    setDraftQ(q);
  }

  useEffect(() => {
    if (debouncedQ !== draftQ) {
      return;
    }

    if (debouncedQ === q) {
      return;
    }

    onSearchChange(debouncedQ);
  }, [debouncedQ, draftQ, onSearchChange, q]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraftQ(event.target.value);
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (isProductCategoryFilter(event.target.value)) {
      onCategoryChange(event.target.value);
    }
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (isProductSort(event.target.value)) {
      onSortChange(event.target.value);
    }
  };

  return (
    <form className="flex flex-wrap items-center gap-3">
      <label className="grid gap-1.5 max-md:flex-[1_1_100%]">
        검색
        <input
          className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          name="q"
          placeholder="상품명 또는 브랜드"
          value={draftQ}
          onChange={handleSearchChange}
        />
      </label>
      <label className="grid gap-1.5 max-md:flex-[1_1_100%]">
        카테고리
        <select
          className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          name="category"
          value={category}
          onChange={handleCategoryChange}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 max-md:flex-[1_1_100%]">
        정렬
        <select
          className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          name="sort"
          value={sort}
          onChange={handleSortChange}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        className="self-end border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
        type="button"
        onClick={onReset}
      >
        필터 초기화
      </button>
    </form>
  );
}

function isProductCategoryFilter(value: string): value is ProductCategoryFilter {
  return CATEGORY_OPTIONS.some((option) => option.value === value);
}

function isProductSort(value: string): value is ProductSort {
  return SORT_OPTIONS.some((option) => option.value === value);
}
