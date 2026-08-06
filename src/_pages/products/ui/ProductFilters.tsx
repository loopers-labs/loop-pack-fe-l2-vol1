import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/shared/lib/debounce/useDebouncedValue";
import { useSelect } from "@/shared/ui/select/useSelect";
import type { ProductCategoryFilter, ProductSort } from "../model/types";

const SEARCH_DEBOUNCE_DELAY_MS = 300;

const CATEGORY_OPTIONS: { value: ProductCategoryFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "casual", label: "캐주얼" },
  { value: "fashion", label: "패션" },
  { value: "goods", label: "뷰티·잡화" },
  { value: "home", label: "홈" },
  { value: "digital", label: "디지털" },
];

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
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

  return (
    <form className="flex flex-wrap items-end gap-3 rounded-gds-lg bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
      <label className="grid flex-1 gap-1.5 text-sm font-semibold text-gds-gray-900 max-md:flex-[1_1_100%]">
        검색
        <input
          className="min-h-11 rounded-gds-sm border border-gds-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gds-gray-900 placeholder:text-gds-gray-500 focus:border-gds-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
          name="q"
          placeholder="상품명 또는 브랜드"
          value={draftQ}
          onChange={handleSearchChange}
        />
      </label>
      <FilterSelect
        label="카테고리"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={onCategoryChange}
      />
      <FilterSelect label="정렬" options={SORT_OPTIONS} value={sort} onChange={onSortChange} />
      <button
        className="min-h-11 cursor-pointer rounded-gds-sm border border-gds-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gds-gray-900 hover:border-gds-green-500 hover:bg-gds-green-50 hover:text-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
        type="button"
        onClick={onReset}
      >
        필터 초기화
      </button>
    </form>
  );
}

type FilterSelectOption<Value extends string> = {
  value: Value;
  label: string;
};

type FilterSelectProps<Value extends string> = {
  label: string;
  options: FilterSelectOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

function FilterSelect<Value extends string>({
  label,
  options,
  value,
  onChange,
}: FilterSelectProps<Value>) {
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const select = useSelect({
    items: options,
    selectedItem: selectedOption,
    getItemKey: (item) => item?.value,
    onSelectedItemChange: (item) => onChange(item.value),
  });

  return (
    <div className="relative grid gap-1.5 text-sm font-semibold text-gds-gray-900 max-md:flex-[1_1_100%]">
      <label {...select.getLabelProps()}>{label}</label>
      <div {...select.getRootProps()}>
        <button
          className="flex min-h-11 min-w-36 cursor-pointer items-center justify-between gap-3 rounded-gds-sm border border-gds-gray-300 bg-white px-3 py-2.5 text-left text-sm font-normal text-gds-gray-900 hover:border-gds-green-500 focus:border-gds-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
          {...select.getToggleButtonProps()}
        >
          <span>{selectedOption.label}</span>
          <span className={select.isOpen ? "text-gds-green-700" : "text-gds-gray-500"} aria-hidden>
            {select.isOpen ? "⌃" : "⌄"}
          </span>
        </button>
        {select.isOpen && (
          <ul
            className="absolute top-[calc(100%+6px)] right-0 left-0 z-20 overflow-hidden rounded-gds-md border border-gds-gray-200 bg-white py-1 shadow-[0_12px_28px_rgba(25,25,25,0.12),0_2px_6px_rgba(25,25,25,0.06)]"
            {...select.getMenuProps()}
          >
            {options.map((option, index) => {
              const state = select.getItemState({ item: option, index });

              return (
                <li
                  key={option.value}
                  className={getFilterSelectOptionClassName(state)}
                  {...select.getItemProps({ item: option, index })}
                >
                  <span>{option.label}</span>
                  {state.selected && (
                    <span className="text-gds-green-700" aria-hidden>
                      ✓
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function getFilterSelectOptionClassName({
  selected,
  highlighted,
}: {
  selected: boolean;
  highlighted: boolean;
}) {
  const classNames = [
    "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm font-semibold outline-none",
  ];

  if (highlighted) {
    classNames.push("bg-gds-green-50 text-gds-green-700");
  } else if (selected) {
    classNames.push("text-gds-green-700");
  } else {
    classNames.push("text-gds-gray-900");
  }

  return classNames.join(" ");
}
