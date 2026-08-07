import type { Metadata } from 'next'
import { connection } from 'next/server'
import type { JSX } from 'react'
import { buildHomeMetadata, HomePage, homeQueryOptions } from '@/_pages/home'
import { getServerQueryClient } from '@/shared/api/getServerQueryClient'

export async function generateMetadata(): Promise<Metadata> {
  await connection()

  try {
    const queryClient = getServerQueryClient()
    const home = await queryClient.fetchQuery(homeQueryOptions())
    return buildHomeMetadata(home)
  } catch {
    return {}
  }
}

// 라우팅 진입점 — 조합은 _pages/home이 한다.
export default function Page(): JSX.Element {
  return <HomePage />
}
