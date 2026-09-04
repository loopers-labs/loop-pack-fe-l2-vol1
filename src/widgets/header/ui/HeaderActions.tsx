'use client'

import Link from 'next/link'
import type { JSX } from 'react'
import { LogoutButton } from '@/features/auth'
import { useCartCount } from '@/entities/cart'
import { useWishCount } from '@/entities/wishlist'

interface HeaderActionsProps {
  userName: string | null
}

export function HeaderActions({ userName }: HeaderActionsProps): JSX.Element {
  const cartCount = useCartCount()
  const wishCount = useWishCount()

  return (
    <>
      <span>위시리스트 {wishCount}</span>
      <Link href="/checkout">장바구니 {cartCount}</Link>
      {userName === null ? (
        <Link href="/login">로그인</Link>
      ) : (
        <>
          <span>{userName}</span>
          <LogoutButton />
        </>
      )}
    </>
  )
}
