import { CartContent } from '@/_pages/cart/ui/CartContent'
import { Header } from '@/widgets/header'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import '@/shared/styles/layout.css'

export const CartPage = () => (
  <PageContainer>
    <Header />
    <section className="layout-section">
      <h1>장바구니</h1>
      <CartContent />
    </section>
  </PageContainer>
)
