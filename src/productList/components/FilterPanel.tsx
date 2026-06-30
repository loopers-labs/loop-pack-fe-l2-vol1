import { CATEGORIES } from "../constants";
import { parsePrice } from "../utils";
import type { CategoryFilter } from "../types";

/** 카테고리·가격 범위·재고 옵션 필터와 초기화 버튼을 담은 패널. */
export default function FilterPanel({
  category,
  minPrice,
  maxPrice,
  inStockOnly,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockToggle,
  onReset,
}: {
  category: CategoryFilter;
  minPrice: number | "";
  maxPrice: number | "";
  inStockOnly: boolean;
  onCategoryChange: (next: CategoryFilter) => void;
  onMinPriceChange: (value: number | "") => void;
  onMaxPriceChange: (value: number | "") => void;
  onInStockToggle: (next: boolean) => void;
  onReset: () => void;
}) {
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
            onChange={(e) => onMinPriceChange(parsePrice(e.target.value))}
            min={0}
          />
          <span>~</span>
          <input
            type="number"
            placeholder="최대"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(parsePrice(e.target.value))}
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
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockToggle(e.target.checked)}
          />
          재고 있는 것만
        </label>
      </div>

      <button className="reset-button" onClick={onReset}>
        필터 초기화
      </button>
    </section>
  );
}
