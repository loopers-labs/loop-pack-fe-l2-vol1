// [AI 생성] 3주차 관심사 분리 — 필터 패널 (UI + 이벤트→값 변환, 검토·수정)
import { CATEGORIES } from "../constants";
import type { CategoryFilter } from "../types";

type FilterPanelProps = {
  category: CategoryFilter;
  minPrice: number | "";
  maxPrice: number | "";
  inStockOnly: boolean;
  onSelectCategory: (category: CategoryFilter) => void;
  onChangeMinPrice: (value: number | "") => void;
  onChangeMaxPrice: (value: number | "") => void;
  onToggleInStock: (on: boolean) => void;
  onReset: () => void;
};

export function FilterPanel({
  category,
  minPrice,
  maxPrice,
  inStockOnly,
  onSelectCategory,
  onChangeMinPrice,
  onChangeMaxPrice,
  onToggleInStock,
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
              onClick={() => onSelectCategory(cat.value)}
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
            onChange={(e) => onChangeMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
          />
          <span>~</span>
          <input
            type="number"
            placeholder="최대"
            value={maxPrice}
            onChange={(e) => onChangeMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>옵션</label>
        <label
          style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, fontSize: 13 }}
        >
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
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
