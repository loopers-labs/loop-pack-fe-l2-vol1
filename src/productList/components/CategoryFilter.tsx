import type { ProductCategory } from '../types';

const CATEGORIES: { value: 'all' | ProductCategory; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'electronics', label: '전자제품' },
  { value: 'fashion', label: '패션' },
  { value: 'home', label: '홈' },
  { value: 'beauty', label: '뷰티' },
];

interface CategoryFilterProps {
  value: 'all' | ProductCategory;
  onChange: (category: 'all' | ProductCategory) => void;
}

/**
 * 카테고리 선택 버튼 그룹
 * - 분리 기준: Page 컴포넌트에 특정 영역에서만 사용되는 상수와, 또 그 상수를 이용한 렌더링이 혼재되어있어 가독성을 저해한다고 생각하였습니다.
 *   CATEGORIES 상수는 CategoryFilter 컴포넌트에서만 사용되는 데이터라 함께 두었습니다. 여기서 `useProductFilters` 훅을 호출하면 기존 상태와 다른 스코프의 상태가 새로 생성되기 때문에
 *   모든 상태는 Page 컴포넌트에서 관리하였고, props drilling은 한 번만 일어났기 때문에 context 고려는 하지 않게 되었습니다.
 */
const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
  return (
    <div className="filter-group">
      <label>카테고리</label>
      <div className="category-list">
        {CATEGORIES.map((cat) => (
          <button key={cat.value} className={value === cat.value ? 'active' : ''} onClick={() => onChange(cat.value)}>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
