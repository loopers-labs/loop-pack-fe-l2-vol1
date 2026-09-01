'use client';

import { useEffect, useRef } from 'react';

import { trackProductListView } from '@/shared/lib/analytics/events';

type ListViewCondition = {
  category: string;
  sort: string;
  page: number;
};

/**
 * 목록 화면 진입을 한 번 알린다.
 *
 * 조건이 바뀔 때마다 다시 발화하지 않는다. 시드 로그에서 product_list_view 는 세션당
 * 거의 1회이고, 조건 변경은 category_filter_change · sort_change · page_change 가 따로 맡는다.
 * 조건마다 발화시키면 3단계에서 "목록을 본 세션"이 조작 횟수만큼 부풀어 순위가 틀어진다.
 *
 * 진입 시점의 조건을 ref 에 담아 쓴다. 의존성 배열을 비운 채 조건을 직접 읽으면
 * 나중에 바뀐 값을 보내게 되고, 조건을 넣으면 변경마다 발화한다.
 */
export function useProductListView(condition: ListViewCondition): void {
  const entryCondition = useRef(condition);

  useEffect(() => {
    trackProductListView(entryCondition.current);
  }, []);
}
