import { redirect } from 'next/navigation'
import type { JSX } from 'react'
import { OrderListPage } from '@/_pages/orders'
import { getCurrentUser } from '@/entities/session/server'

export default async function Page(): Promise<JSX.Element> {
  const user = await getCurrentUser()

  if (user === null) {
    redirect('/login?returnTo=%2Forders')
  }

  return <OrderListPage />
}
