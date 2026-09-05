'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { resetCart } from '@/entities/cart/model/cart'
import { resetWishlist } from '@/entities/wishlist/model/wishlist'

// 로그아웃은 서버의 쿠키와 클라이언트 상태를 함께 되돌린다.
//
// 담기와 찜은 서버 원본이 없는 익명 상태다(entities/cart, entities/wishlist).
// 그래도 로그아웃 때 비운다. 로그아웃은 "이 브라우저를 다음 사람에게 넘긴다"는 신호이고,
// 공용 PC 에서 앞사람의 장바구니가 그대로 남아 있으면 그 사람이 무엇을 보고 있었는지가
// 새 사용자에게 드러난다. 남겨서 얻는 편의보다 이 쪽이 크다.
//
// 서버 요청이 실패하면 클라이언트 상태를 비우지 않는다. 쿠키가 남은 채로 화면만
// 로그아웃처럼 보이면, 사용자는 로그아웃했다고 믿고 자리를 뜬다.
export default function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const logout = async () => {
    setPending(true)
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) {
        setPending(false)
        return
      }
    } catch {
      setPending(false)
      return
    }

    resetCart()
    resetWishlist()

    // 홈으로 보낸 뒤 서버 렌더를 다시 받는다. 보호 경로에 머문 채 새로고침하면
    // 가드가 로그인 화면으로 보내므로, 사용자가 로그아웃 직후 로그인 화면을 본다.
    router.replace('/')
    router.refresh()
  }

  return (
    <button type="button" onClick={logout} disabled={pending}>
      로그아웃
    </button>
  )
}
