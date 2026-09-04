import Link from 'next/link'
import type { JSX } from 'react'
import { getCurrentUser } from '@/entities/session/server'
import { HeaderActions } from './HeaderActions'
export async function Header(): Promise<JSX.Element> {
  const user = await getCurrentUser()

  return (
    <div className="commerce-header">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
          <HeaderActions userName={user?.name ?? null} />
        </nav>
      </header>
    </div>
  )
}
