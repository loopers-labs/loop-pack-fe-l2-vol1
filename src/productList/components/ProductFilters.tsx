import { useEffect, useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { ProductCategoryFilter } from "../types";

const PRICE_DEBOUNCE_DELAY_MS = 300;

const CATEGORIES: { value: ProductCategoryFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "electronics", label: "전자제품" },
  { value: "fashion", label: "패션" },
  { value: "home", label: "홈" },
  { value: "beauty", label: "뷰티" },
];

type ProductFiltersProps = {
  category: ProductCategoryFilter;
  minPrice: number | "";
  maxPrice: number | "";
  inStockOnly: boolean;
  onCategoryChange: (category: ProductCategoryFilter) => void;
  onMinPriceChange: (minPrice: number | "") => void;
  onMaxPriceChange: (maxPrice: number | "") => void;
  onInStockOnlyChange: (inStockOnly: boolean) => void;
  onReset: () => void;
};

export function ProductFilters({
  category,
  minPrice,
  maxPrice,
  inStockOnly,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockOnlyChange,
  onReset,
}: ProductFiltersProps) {
  const [draftMinPrice, setDraftMinPrice] = useState(minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);
  const [prevMinPrice, setPrevMinPrice] = useState(minPrice);
  const [prevMaxPrice, setPrevMaxPrice] = useState(maxPrice);
  const debouncedMinPrice = useDebouncedValue(draftMinPrice, PRICE_DEBOUNCE_DELAY_MS);
  const debouncedMaxPrice = useDebouncedValue(draftMaxPrice, PRICE_DEBOUNCE_DELAY_MS);

  if (minPrice !== prevMinPrice) {
    setPrevMinPrice(minPrice);
    setDraftMinPrice(minPrice);
  }

  if (maxPrice !== prevMaxPrice) {
    setPrevMaxPrice(maxPrice);
    setDraftMaxPrice(maxPrice);
  }

  useEffect(() => {
    if (debouncedMinPrice !== draftMinPrice) {
      return;
    }

    if (debouncedMinPrice === minPrice) {
      return;
    }

    onMinPriceChange(debouncedMinPrice);
  }, [debouncedMinPrice, draftMinPrice, minPrice, onMinPriceChange]);

  useEffect(() => {
    if (debouncedMaxPrice !== draftMaxPrice) {
      return;
    }

    if (debouncedMaxPrice === maxPrice) {
      return;
    }

    onMaxPriceChange(debouncedMaxPrice);
  }, [debouncedMaxPrice, draftMaxPrice, maxPrice, onMaxPriceChange]);

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDraftMinPrice(value === "" ? "" : Math.max(Number(value), 0));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDraftMaxPrice(value === "" ? "" : Math.max(Number(value), 0));
  };

  const handleInStockOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInStockOnlyChange(e.target.checked);
  };

  return (
    <section className="filter-panel">
      <div className="filter-group">
        <label>카테고리</label>
        <div className="category-list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={category === cat.value ? "active" : ""}
              onClick={() => onCategoryChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label>가격 범위</label>
        <div className="price-range">
          <input
            type="number"
            placeholder="최소"
            value={draftMinPrice}
            onChange={handleMinPriceChange}
            min={0}
          />
          <span>~</span>
          <input
            type="number"
            placeholder="최대"
            value={draftMaxPrice}
            onChange={handleMaxPriceChange}
            min={0}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>옵션</label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 400,
            fontSize: 13,
          }}
        >
          <input type="checkbox" checked={inStockOnly} onChange={handleInStockOnlyChange} />
          재고 있는 것만
        </label>
      </div>

      <button className="reset-button" onClick={onReset}>
        필터 초기화
      </button>
    </section>
  );
}
