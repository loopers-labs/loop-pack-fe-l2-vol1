import type { ProductCategoryFilter } from '../types'

type CategoryOption = {
  value: ProductCategoryFilter
  label: string
}

type ProductFilterPanelProps = {
  categories: CategoryOption[]
  category: ProductCategoryFilter
  minPrice: number | ''
  maxPrice: number | ''
  inStockOnly: boolean
  onCategoryChange: (category: ProductCategoryFilter) => void
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  onInStockToggle: (checked: boolean) => void
  onResetFilters: () => void
}

export function ProductFilterPanel({
  categories,
  category,
  minPrice,
  maxPrice,
  inStockOnly,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockToggle,
  onResetFilters,
}: ProductFilterPanelProps) {
  return (
    <section className="filter-panel">
      <div className="filter-group">
        <label>카테고리</label>
        <div className="category-list">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={category === cat.value ? 'active' : ''}
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
            onChange={(event) => onMinPriceChange(event.target.value)}
            min={0}
          />
          <span>~</span>
          <input
            type="number"
            placeholder="최대"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            min={0}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>옵션</label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 400,
            fontSize: 13,
          }}
        >
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => onInStockToggle(event.target.checked)}
          />
          재고 있는 것만
        </label>
      </div>

      <button className="reset-button" onClick={onResetFilters}>
        필터 초기화
      </button>
    </section>
  )
}
