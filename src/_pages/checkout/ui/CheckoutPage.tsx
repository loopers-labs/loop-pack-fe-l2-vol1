import { CheckoutContent } from '@/_pages/checkout/ui/CheckoutContent'
import { requireSession } from '@/entities/session/server'
import { Header } from '@/widgets/header'
import { ROUTES } from '@/shared/config/routes'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import '@/shared/styles/layout.css'

export const CheckoutPage = async () => {
  await requireSession(ROUTES.CHECKOUT)

  return (
    <PageContainer>
      <Header />
      <section className="layout-section">
        <h1>주문서</h1>
        <CheckoutContent />
      </section>
    </PageContainer>
  )
}
