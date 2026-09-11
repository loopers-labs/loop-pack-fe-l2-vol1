import { CartContent } from '@/_pages/cart/ui/CartContent'
import { requireSession } from '@/entities/session/server'
import { Header } from '@/widgets/header'
import { ROUTES } from '@/shared/config/routes'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import '@/shared/styles/layout.css'

export const CartPage = async () => {
  await requireSession(ROUTES.CART)

  return (
    <PageContainer>
      <Header />
      <section className="layout-section">
        <h1>장바구니</h1>
        <CartContent />
      </section>
    </PageContainer>
  )
}
