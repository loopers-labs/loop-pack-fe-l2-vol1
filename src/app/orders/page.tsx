import { redirect } from 'next/navigation'
import type { JSX } from 'react'
import { OrderListPage } from '@/_pages/orders'
import { getCurrentUser } from '@/entities/session/server'
import {
  buildProtectedReturnPath,
  type RouteSearchParams,
} from '@/features/auth'

interface PageProps {
  searchParams?: Promise<RouteSearchParams>
}

export default async function Page({
  searchParams,
}: PageProps = {}): Promise<JSX.Element> {
  const user = await getCurrentUser()

  if (user === null) {
    const returnTo = buildProtectedReturnPath('/orders', await searchParams)
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return <OrderListPage />
}
