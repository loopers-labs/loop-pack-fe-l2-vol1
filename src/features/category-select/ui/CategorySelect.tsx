"use client";

import {
  CATEGORY_LABELS,
  CATEGORY_VALUES,
  isCategoryValue,
  type CategoryId,
} from "@/entities/product";

type CategorySelectProps = {
  value: CategoryId | "all";
  onChange: (category: CategoryId | "all") => void;
};

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <label>
      카테고리
      <select
        value={value}
        onChange={(event) => {
          if (!isCategoryValue(event.target.value)) return;
          onChange(event.target.value);
        }}
      >
        {CATEGORY_VALUES.map((category) => (
          <option key={category} value={category}>
            {CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>
    </label>
  );
}
