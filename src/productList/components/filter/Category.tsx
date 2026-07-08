import type { Category as CategoryType } from '../../shared';
import { FilterGroupShell } from './FilterGroupShell';

const CATEGORIES: { value: CategoryType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'electronics', label: '전자제품' },
  { value: 'fashion', label: '패션' },
  { value: 'home', label: '홈' },
  { value: 'beauty', label: '뷰티' },
];

export const Category = ({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: CategoryType;
  onCategoryChange: (cat: CategoryType) => void;
}) => {
  return (
    <FilterGroupShell label="카테고리">
      <div className="category-list">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={selectedCategory === cat.value ? 'active' : ''}
            onClick={() => onCategoryChange(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </FilterGroupShell>
  );
};
