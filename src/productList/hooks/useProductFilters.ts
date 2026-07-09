import { useState } from 'react';

import type { SortBy } from '../dto';
import type { ProductCategory } from '../types';

/** 의도를 명확하게 하기 위해 useProductFilters 에서만 사용하는 초기값 함수를 동일한 파일에 생성하였습니다. */
const getInitialFilters = () => {
  const params = new URLSearchParams(window.location.search);
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');

  return {
    category: (params.get('category') as 'all' | ProductCategory | null) ?? 'all',
    minPrice: (minPrice ? Number(minPrice) : '') as number | '',
    maxPrice: (maxPrice ? Number(maxPrice) : '') as number | '',
    sortBy: (params.get('sort') as SortBy | null) ?? 'latest',
    searchQuery: params.get('q') ?? '',
    inStockOnly: params.get('inStock') === 'true',
  };
};

/**
 * 상품 조회 조건(카테고리/가격/정렬/검색/재고) 상태 관리 훅
 * - 분리 기준: api endpoint에 포함되는 파라미터들과 검색 조건이 초기화될 떄, 함께 초기화되는 값들을 한 곳에 모았습니다.
 * - 질문: 상태를 filter와 관련없는 검색역할을 하는 searchQuery 상태도 일단은 서버로 가는 파라미터는 한 곳에 있는게 관리하기 편할 것 같다고 판단하여 같이 두었는데,
 *   멘토님은 이 부분에 대해 어떻게 생각하시는지 궁금합니다. 표면적으로 보면 검색어 입력은 filter랑은 관련이 없어보여서 고민이였습니다.
 */
export const useProductFilters = () => {
  const initial = getInitialFilters();

  const [category, setCategory] = useState<'all' | ProductCategory>(initial.category);
  const [minPrice, setMinPrice] = useState<number | ''>(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | ''>(initial.maxPrice);
  const [sortBy, setSortBy] = useState<SortBy>(initial.sortBy);
  const [searchQuery, setSearchQuery] = useState(initial.searchQuery);
  const [inStockOnly, setInStockOnly] = useState(initial.inStockOnly);

  const resetFilters = () => {
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('latest');
    setSearchQuery('');
    setInStockOnly(false);
  };

  return {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setSearchQuery,
    setInStockOnly,
    resetFilters,
  };
};
