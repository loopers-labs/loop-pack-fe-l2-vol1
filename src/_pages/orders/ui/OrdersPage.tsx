import { OrderList } from '@/_pages/orders/ui/OrderList'
import { Header } from '@/widgets/header'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import '@/shared/styles/layout.css'

export const OrdersPage = () => (
  <PageContainer>
    <Header />
    <section className="layout-section">
      <h1>주문 내역</h1>
      <OrderList />
    </section>
  </PageContainer>
)
