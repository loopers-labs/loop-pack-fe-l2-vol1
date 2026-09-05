import type { Metadata } from 'next'
import { requireSessionUser } from '@/app/_session/currentUser'
import OrderHistory from '@/_pages/orders/ui/OrderHistory'

export const metadata: Metadata = {
  title: '주문 내역',
}

// proxy 는 쿠키의 존재만 본다. 서명과 만료를 실제로 판정하는 자리가 여기다.
// 돌아올 경로를 직접 적는 이유는 서버 컴포넌트가 자기 pathname 을 모르기 때문이다.
export default async function OrdersPage() {
  await requireSessionUser('/orders')

  return <OrderHistory />
}
