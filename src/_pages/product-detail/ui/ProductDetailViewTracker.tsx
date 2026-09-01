'use client';

import { useProductDetailView } from '../model/useProductDetailView';

/**
 * 상세 진입 계측만 하는 클라이언트 경계.
 *
 * 그리는 것이 없다. 서버 컴포넌트인 상세 화면이 effect 를 쓸 수 없어, 계측을 위해
 * 클라이언트 경계 하나가 필요할 뿐이다. 화면 요소에 계측을 얹으면 그 요소를 지우거나
 * 옮길 때 계측이 함께 사라진다.
 */
export function ProductDetailViewTracker({ productId }: { productId: string }) {
  useProductDetailView(productId);

  return null;
}
