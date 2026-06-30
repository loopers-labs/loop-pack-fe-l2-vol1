import type { CategoryFilter as Category } from "../../types";
import CategoryFilter from "./CategoryFilter";
import PriceRangeFilter from "./PriceRangeFilter";
import InStockToggle from "./InStockToggle";

/** 카테고리·가격·재고 필터 섹션과 초기화 버튼을 배치하는 패널. */
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
  category: Category;
  minPrice: number | "";
  maxPrice: number | "";
  inStockOnly: boolean;
  onCategoryChange: (next: Category) => void;
  onMinPriceChange: (value: number | "") => void;
  onMaxPriceChange: (value: number | "") => void;
  onInStockToggle: (next: boolean) => void;
  onReset: () => void;
}) {
  return (
    <section className="filter-panel">
      <CategoryFilter category={category} onCategoryChange={onCategoryChange} />
      <PriceRangeFilter
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
      />
      <InStockToggle
        inStockOnly={inStockOnly}
        onInStockToggle={onInStockToggle}
      />

      <button className="reset-button" onClick={onReset}>
        필터 초기화
      </button>
    </section>
  );
}
