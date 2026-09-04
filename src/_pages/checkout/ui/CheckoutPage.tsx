import { CheckoutContent } from '@/_pages/checkout/ui/CheckoutContent'
import { Header } from '@/widgets/header'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import '@/shared/styles/layout.css'

export const CheckoutPage = () => (
  <PageContainer>
    <Header />
    <section className="layout-section">
      <h1>주문서</h1>
      <CheckoutContent />
    </section>
  </PageContainer>
)
