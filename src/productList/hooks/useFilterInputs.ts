import { useState, useEffect } from 'react';
import type { ProductParams } from '../shared';
import { getUrlSearchParams, setUrlSearchParams } from '../utils/urlSearchParams';
import { useSearchParams } from '../../shared/hooks/useSearchParams';

type TextDraft = Pick<ProductParams, 'searchQuery' | 'minPrice' | 'maxPrice'>;
const TEXT_COMMIT_DEBOUNCE_MS = 300;

export const useFilterInputs = () => {
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
      // 뒤로가기나 초기화를 통해 url이 바뀐 경우는 draft와 url의 값이 동일하므로 불필요한 커밋을 제외시킨다.
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

  return { draft, handleSearchChange, handleMinPriceChange, handleMaxPriceChange };
};
