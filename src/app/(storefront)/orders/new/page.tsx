import type { Metadata } from 'next'
import { requireSessionUser } from '@/app/_session/currentUser'
import OrderForm from '@/_pages/orders/ui/OrderForm'

export const metadata: Metadata = {
  title: '주문서',
}

export default async function NewOrderPage() {
  await requireSessionUser('/orders/new')

  return <OrderForm />
}
