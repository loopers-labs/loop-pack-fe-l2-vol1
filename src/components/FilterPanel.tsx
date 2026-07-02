import type { Product } from '../types/product';
import type { ProductFilters } from '../hooks/useProductFilters';

const CATEGORIES: { value: 'all' | Product['category']; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'electronics', label: '전자제품' },
  { value: 'fashion', label: '패션' },
  { value: 'home', label: '홈' },
  { value: 'beauty', label: '뷰티' },
];

export function FilterPanel({ filters }: { filters: ProductFilters }) {
  const {
    values,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setInStockOnly,
    reset,
  } = filters;

  return (
    <section className="filter-panel">
      <div className="filter-group">
        <label>카테고리</label>
        <div className="category-list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={values.category === cat.value ? 'active' : ''}
              onClick={() => setCategory(cat.value)}
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
            value={values.minPrice}
            onChange={(e) =>
              setMinPrice(e.target.value === '' ? '' : Number(e.target.value))
            }
            min={0}
          />
          <span>~</span>
          <input
            type="number"
            placeholder="최대"
            value={values.maxPrice}
            onChange={(e) =>
              setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))
            }
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
            checked={values.inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          재고 있는 것만
        </label>
      </div>

      <button className="reset-button" onClick={reset}>
        필터 초기화
      </button>
    </section>
  );
}
