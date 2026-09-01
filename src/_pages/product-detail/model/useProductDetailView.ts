'use client';

import { useEffect, useRef } from 'react';

import { trackProductDetailView } from '@/shared/lib/analytics/events';

/**
 * 상세 화면 진입을 한 번 알린다.
 *
 * 상세 화면은 서버 컴포넌트라 effect 를 쓸 수 없다. 계측만 하는 작은 클라이언트 컴포넌트가
 * 이 훅을 부르고, 서버 컴포넌트는 그 컴포넌트를 꽂는다.
 */
export function useProductDetailView(productId: string): void {
  const viewedProductId = useRef(productId);

  useEffect(() => {
    trackProductDetailView(viewedProductId.current);
  }, []);
}
