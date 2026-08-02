"use client";

import {
  isSortValue,
  SORT_LABELS,
  SORT_VALUES,
  type ProductSort,
} from "@/entities/product";

type SortSelectProps = {
  value: ProductSort;
  onChange: (sort: ProductSort) => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label>
      정렬
      <select
        value={value}
        onChange={(event) => {
          if (!isSortValue(event.target.value)) return;
          onChange(event.target.value);
        }}
      >
        {SORT_VALUES.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </option>
        ))}
      </select>
    </label>
  );
}
