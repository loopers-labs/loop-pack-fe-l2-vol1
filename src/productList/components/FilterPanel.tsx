import type { ProductFiltersController } from "../hooks/useProductFilters";
import type { Product } from "../types";

const CATEGORIES: {
  value: "all" | Product["category"];
  label: string;
}[] = [
  { value: "all", label: "전체" },
  { value: "electronics", label: "전자제품" },
  { value: "fashion", label: "패션" },
  { value: "home", label: "홈" },
  { value: "beauty", label: "뷰티" },
];

interface FilterPanelProps {
  filters: ProductFiltersController;
}

export function FilterPanel({ filters }: FilterPanelProps) {
  const {
    category,
    minPrice,
    maxPrice,
    inStockOnly,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleInStockToggle,
    handleResetFilters,
  } = filters;

  return (
    <section className="filter-panel">
      <div className="filter-group">
        <label>카테고리</label>
        <div className="category-list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={category === cat.value ? "active" : ""}
              onClick={() => handleCategoryChange(cat.value)}
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
            onChange={handleMinPriceChange}
            min={0}
          />
          <span>~</span>
          <input
            type="number"
            placeholder="최대"
            value={maxPrice}
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
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={handleInStockToggle}
          />
          재고 있는 것만
        </label>
      </div>

      <button className="reset-button" onClick={handleResetFilters}>
        필터 초기화
      </button>
    </section>
  );
}
