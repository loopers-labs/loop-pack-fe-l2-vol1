import { useEffect, useState } from 'react';
import type { Category, ProductParams, SortBy } from '../shared';
import { getUrlSearchParams, setUrlSearchParams } from '../utils/urlSearchParams';
import { useSearchParams } from '../../shared/hooks/useSearchParams';

const TEXT_COMMIT_DEBOUNCE_MS = 300;

type TextDraft = Pick<ProductParams, 'searchQuery' | 'minPrice' | 'maxPrice'>;

export const useProductResult = () => {
  const { searchParams, update } = useSearchParams();
  const params = getUrlSearchParams(searchParams);

  const { searchQuery, minPrice, maxPrice } = params;

  // 텍스트/숫자 입력은 즉시 반응(draft)하지만 URL 커밋은 지연시킨다.
  const [draft, setDraft] = useState<TextDraft>({
    searchQuery,
    minPrice,
    maxPrice,
  });

  // URL이 외부에서 바뀌면(뒤로가기/초기화) draft를 URL 값으로 맞춘다.
  useEffect(() => {
    setDraft({ searchQuery, minPrice, maxPrice });
  }, [searchQuery, minPrice, maxPrice]);

  // draft가 안정되면 URL로 커밋. 외부 변경 직후엔 draft===URL이라 커밋하지 않는다.
  useEffect(() => {
    if (
      draft.searchQuery === searchQuery &&
      draft.minPrice === minPrice &&
      draft.maxPrice === maxPrice
    ) {
      return;
    }
    const timer = setTimeout(() => {
      const current = getUrlSearchParams(new URLSearchParams(window.location.search));
      update(setUrlSearchParams({ ...current, ...draft, page: 1 }));
    }, TEXT_COMMIT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, searchQuery, minPrice, maxPrice, update]);

  // 이산 필터는 즉시 URL에 반영한다(히스토리 엔트리 생성 → 뒤로가기 지원).
  // 이때 미커밋 draft를 함께 flush해서 타이핑 중이던 값을 잃지 않게 한다.
  const writeParams = (override: Partial<ProductParams>) => {
    update(setUrlSearchParams({ ...params, ...draft, ...override }));
  };

  const handleCategoryChange = (cat: Category) => {
    writeParams({ category: cat, page: 1 });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const SORT_VALUES: Record<string, SortBy> = {
      latest: 'latest',
      popular: 'popular',
      'price-asc': 'price-asc',
      'price-desc': 'price-desc',
    };
    const selected = SORT_VALUES[e.target.value];
    if (selected) {
      writeParams({ sortBy: selected, page: 1 });
    }
  };

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    writeParams({ inStockOnly: e.target.checked, page: 1 });
  };

  const handlePageChange = (next: number) => {
    writeParams({ page: next });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDraft((prev) => ({ ...prev, minPrice: v === '' ? '' : Number(v) }));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDraft((prev) => ({ ...prev, maxPrice: v === '' ? '' : Number(v) }));
  };

  const handleResetFilters = () => {
    writeParams({
      category: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'latest',
      searchQuery: '',
      inStockOnly: false,
      page: 1,
    });
  };

  return {
    category: params.category,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sortBy: params.sortBy,
    searchQuery: params.searchQuery,
    page: params.page,
    inStockOnly: params.inStockOnly,
    searchInput: draft.searchQuery,
    minPriceInput: draft.minPrice,
    maxPriceInput: draft.maxPrice,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handlePageChange,
    handleResetFilters,
  };
};
