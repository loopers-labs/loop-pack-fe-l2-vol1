import { FilterGroupShell } from './FilterGroupShell';

export const PriceRange = ({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: {
  minPrice: number | '';
  maxPrice: number | '';
  onMinPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <FilterGroupShell label="가격 범위">
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
    </FilterGroupShell>
  );
};
