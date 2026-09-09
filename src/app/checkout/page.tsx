import { redirect } from 'next/navigation'

import { getAuthSession } from '@/app/_auth/AuthSession'
import { AuthRedirect } from '@/entities/auth/model/AuthRedirect'
import { CheckoutView } from '@/views/checkout/ui/CheckoutView'

export default async function CheckoutPage() {
  const session = await getAuthSession()
  if (session.status !== 'authenticated') {
    const reason = session.status === 'expired' ? '&reason=expired' : ''
    redirect(`${AuthRedirect.toLoginPath('/checkout')}${reason}`)
  }

  return <CheckoutView userId={session.user.id} />
}
