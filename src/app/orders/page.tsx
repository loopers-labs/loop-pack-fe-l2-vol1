// [AI] 얇은 라우팅 진입점. 비즈니스는 _pages/order에 위임.
// 주문 내역은 세션 쿠키가 필요한 개인 데이터라 서버 prefetch 없이 클라이언트에서
// 불러온다. 미로그인 진입 가드는 week-09 1-3의 proxy.ts가 담당한다.
import type { Metadata } from 'next';
import { OrderList } from '@/_pages/order/ui/OrderList';

export const metadata: Metadata = {
  title: '주문 내역',
  // 로그인 사용자의 개인 데이터라 검색 엔진에 노출하지 않는다.
  robots: { index: false },
};

const OrdersPage = () => <OrderList />;

export default OrdersPage;
