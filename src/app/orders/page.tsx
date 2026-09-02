// [AI] 얇은 라우팅 진입점. 비즈니스는 _pages/order에 위임.
// 보호 경로(개인 데이터) 페이지라 요청마다 동적으로 렌더하며, 서버가 세션 쿠키를 판독해
// 초기 HTML 헤더에 로그인 상태를 반영한다 (week-09 1-2, JS 실행 전 판정).
// 공개 페이지(홈·상품)는 정적 생성을 유지하기 위해 쿠키를 읽지 않는다 — 7주차 성능 기준 유지.
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { OrderList } from '@/_pages/order/ui/OrderList';
import { readSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';

export const metadata: Metadata = {
  title: '주문 내역',
  // 로그인 사용자의 개인 데이터라 검색 엔진에 노출하지 않는다.
  robots: { index: false },
};

const OrdersPage = async () => {
  // 요청 헤더에 담긴 쿠키를 읽어온다.
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  return <OrderList serverUser={user} />;
};

export default OrdersPage;
