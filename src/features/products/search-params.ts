import { useQueryStates } from 'nuqs';
import { useEffect, useEffectEvent } from 'react';

import type { CategoryFilter } from './constants';
import { conditionParsers, normalizeSearchQuery } from './product-list-params';

import type { ProductSort } from '@/entities/product';

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
      void setConditions({ page }, { scroll: true });
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
