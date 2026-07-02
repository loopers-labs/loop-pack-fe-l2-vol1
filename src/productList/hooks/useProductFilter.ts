import type { Category, ProductParams, SortBy } from '../shared';
import { getUrlSearchParams, setUrlSearchParams } from '../utils/urlSearchParams';
import { useSearchParams } from '../../shared/hooks/useSearchParams';
import { useFilterInputs } from './useFilterInputs';

// searchQuery, minPrice, maxPrice처럼 자주 바뀌는 값들과 이외의 값들을 별도의 상태로 관리
export const useProductFilter = () => {
  // ----- 뒤로가기, 앞으로가기에 따른 상태 변화 및 디바운싱 로직은 AI로 작성 -------
  const { searchParams, update } = useSearchParams();
  const params = getUrlSearchParams(searchParams);

  // 디바운싱을 포함한 입력값(searchQuery, minPrice, maxPrice)은 별도의 훅으로 관리
  const { draft, handleSearchChange, handleMinPriceChange, handleMaxPriceChange } =
    useFilterInputs();

  // 이산 필터는 즉시 URL에 반영한다(히스토리 엔트리 생성 → 뒤로가기 지원).
  // 이때 미커밋 draft를 함께 flush해서 타이핑 중이던 값을 잃지 않게 한다.
  const writeParams = (override: Partial<ProductParams>) => {
    update(setUrlSearchParams({ ...params, ...draft, ...override }));
  };
  // ------------------------------------------------------------------

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
