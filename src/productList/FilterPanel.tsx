import type { ChangeEvent } from "react";
import type { Filters } from "./types.ts";

const CATEGORIES: { value: Filters["category"]; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "electronics", label: "전자제품" },
  { value: "fashion", label: "패션" },
  { value: "home", label: "홈" },
  { value: "beauty", label: "뷰티" },
];

type FilterPanelProps = {
  category: Filters["category"];
  onCategoryChange: (category: Filters["category"]) => void;
  minPrice: Filters["minPrice"];
  onMinPriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
  maxPrice: Filters["maxPrice"];
  onMaxPriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inStockOnly: Filters["inStockOnly"];
  onInStockToggle: (e: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
};

export function FilterPanel({
  category,
  onCategoryChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  inStockOnly,
  onInStockToggle,
  onReset,
}: FilterPanelProps) {
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
            value={minPrice}
            onChange={onMinPriceChange}
            min={0}
          />
          <span>~</span>
          <input
            type="number"
            placeholder="최대"
            value={maxPrice}
            onChange={onMaxPriceChange}
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
          <input type="checkbox" checked={inStockOnly} onChange={onInStockToggle} />
          재고 있는 것만
        </label>
      </div>

      <button className="reset-button" onClick={onReset}>
        필터 초기화
      </button>
    </section>
  );
}
