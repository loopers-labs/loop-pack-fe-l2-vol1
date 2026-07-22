import { createParser, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useEffect, useEffectEvent } from 'react';

import { CATEGORY_FILTERS, type CategoryFilter } from './constants';

import { PRODUCT_SORTS, type ProductSort } from '@/types/commerce';

// 주소로 직접 들어와도, 폼으로 제출해도 같은 규칙을 써야 같은 검색이 같은 캐시를 쓴다.
const normalizeSearchQuery = (value: string) => value.trim().normalize('NFC');

const conditionParsers = {
  q: createParser({
    parse: normalizeSearchQuery,
    serialize: String,
  }).withDefault(''),

  category: parseAsStringLiteral(CATEGORY_FILTERS).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault('latest'),

  page: createParser({
    parse: (value: string) => {
      const page = Number(value);

      return Number.isSafeInteger(page) && page >= 1 ? page : null;
    },
    serialize: String,
  }).withDefault(1),
};

/**
 * 상품 목록 조건.
 * 검색·필터를 바꾸면 결과 목록이 달라지므로 page를 1로 되돌린다.
 */
export function useProductListUrlState() {
  const [conditions, setConditions] = useQueryStates(conditionParsers, {
    history: 'push',
  });

  return {
    conditions,
    submitSearch: (keyword: string) => {
      void setConditions({ q: normalizeSearchQuery(keyword) || null, page: 1 });
    },
    changeCategory: (category: CategoryFilter) => {
      void setConditions({ category, page: 1 });
    },
    changeSort: (sort: ProductSort) => {
      void setConditions({ sort, page: 1 });
    },
    changePage: (page: number) => {
      void setConditions({ page });
    },
  };
}

/**
 * 마지막 페이지를 넘긴 주소를 마지막 페이지로 clamp.
 * 총 개수를 응답으로 받아봐야 알 수 있어 parser에서는 판단할 수 없다.
 * 사용자가 이동한 게 아니므로 뒤로 가기 기록에는 남기지 않는다.
 */
export function usePageClamp(totalPages: number | null) {
  const [{ page }, setConditions] = useQueryStates(conditionParsers, {
    history: 'replace',
  });

  const isPageOutOfRange = totalPages !== null && page > totalPages;
  const clampPage = useEffectEvent((lastPage: number) => {
    void setConditions({ page: lastPage });
  });

  useEffect(() => {
    if (!isPageOutOfRange || totalPages === null) return;

    clampPage(totalPages);
  }, [isPageOutOfRange, totalPages]);

  return { isPageOutOfRange };
}
