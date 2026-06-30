import { CATEGORIES } from "../../constants";
import type { CategoryFilter as Category } from "../../types";

/** 카테고리 선택 버튼 그룹. */
export default function CategoryFilter({
  category,
  onCategoryChange,
}: {
  category: Category;
  onCategoryChange: (next: Category) => void;
}) {
  return (
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
  );
}
