import { redirect } from 'next/navigation'

import { getAuthSession } from '@/app/_auth/AuthSession'
import { AuthRedirect } from '@/entities/auth/model/AuthRedirect'
import { OrdersView } from '@/views/orders/ui/OrdersView'

export default async function OrdersPage() {
  const session = await getAuthSession()
  if (session.status !== 'authenticated') {
    const reason = session.status === 'expired' ? '&reason=expired' : ''
    redirect(`${AuthRedirect.toLoginPath('/orders')}${reason}`)
  }

  return <OrdersView userId={session.user.id} />
}
