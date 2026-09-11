import { OrderListSkeleton } from '@/_pages/orders/ui/OrderListSkeleton'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import '@/shared/styles/layout.css'

// 라우트 전환 중에는 클라이언트 쿼리가 마운트되기 전이므로, 실제 주문 목록과 같은 뼈대를
// 먼저 내보낸다. Header는 서버 세션 조회를 기다리지 않도록 로딩 경계에서는 생략하고,
// 고정된 높이의 헤더 셸로 위치만 확보한다.
export default function OrdersLoading() {
  return (
    <PageContainer>
      <div className="route-loading-header" aria-hidden="true">
        <span />
        <span />
      </div>
      <section className="layout-section">
        <h1>주문 내역</h1>
        <OrderListSkeleton />
      </section>
    </PageContainer>
  )
}
