import { parsePrice } from "../../utils";

/** 최소·최대 가격 범위 입력. */
export default function PriceRangeFilter({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: {
  minPrice: number | "";
  maxPrice: number | "";
  onMinPriceChange: (value: number | "") => void;
  onMaxPriceChange: (value: number | "") => void;
}) {
  return (
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
  );
}
