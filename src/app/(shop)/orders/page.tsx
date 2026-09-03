import { OrdersPageBoundary } from '@/_pages/orders/ui/OrdersPageBoundary';

/**
 * 주문 내역 (보호 경로)
 *
 * 홈과 달리 서버에서 prefetch 하지 않는다. apiClient 의 서버 분기는 절대 URL 로
 * 자기 자신에게 fetch 하는데 들어온 요청의 세션 쿠키를 싣지 않는다. 그대로 prefetch 하면
 * 서버가 401 을 받아 캐시에 실패를 담고, 브라우저는 그 실패를 hydrate 받은 뒤 다시 조회한다.
 * 아낀 왕복은 없고 401 만 한 번 더 만든다.
 *
 * 브라우저 요청은 같은 origin 이라 세션 쿠키가 자동으로 실린다. 조회는 클라이언트에 맡기고
 * 로딩·에러는 OrdersPageBoundary 가 맡는다.
 *
 * 미로그인 접근은 proxy 가 앞에서 막으므로 여기까지 오지 않는다.
 */
export default function OrdersRoute() {
  return <OrdersPageBoundary />;
}
