'use client';
import type { CategoryId, ProductSort } from '@/entities/product/model';

type Props = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  category: CategoryId | 'all';
  onCategoryChange: (category: CategoryId | 'all') => void;
  sort: ProductSort;
  onSortChange: (sort: ProductSort) => void;
};

export function ProductFiltersForm({
  searchInput,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <form className="week05-filters" onSubmit={(e) => e.preventDefault()}>
      <label>
        검색
        <input
          name="q"
          placeholder="상품명 또는 브랜드"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>
      <label>
        카테고리
        <select
          name="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as CategoryId | 'all')}
        >
          <option value="all">전체</option>
          <option value="casual">캐주얼</option>
          <option value="fashion">패션</option>
          <option value="goods">뷰티·잡화</option>
          <option value="home">홈</option>
          <option value="digital">디지털</option>
        </select>
      </label>
      <label>
        정렬
        <select
          name="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ProductSort)}
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
          <option value="price-asc">낮은 가격순</option>
          <option value="price-desc">높은 가격순</option>
        </select>
      </label>
    </form>
  );
}
