'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { APP_EVENT, type WishlistEntryPoint } from '@/analytics/app-events'
import { track } from '@/analytics/logger'
import { selectWishlistItems, useWishlistStore } from '@/entities/wishlist'
import { useHasHydrated } from '@/shared/lib/useHasHydrated'
import { ProductGrid } from '@/widgets/product-card'

// 카드는 기존 widgets/product-card를 그대로 쓴다. 담기·찜 버튼도 목록 화면과 같은 것이라
// 위시리스트 전용 카드를 만들 이유가 없다.
type WishlistContentProps = {
  entryPoint: WishlistEntryPoint
}

export const WishlistContent = ({ entryPoint }: WishlistContentProps) => {
  const items = useWishlistStore(selectWishlistItems)
  const hasHydrated = useHasHydrated(useWishlistStore)
  const hasTrackedViewRef = useRef(false)

  useEffect(() => {
    if (!hasHydrated || hasTrackedViewRef.current) {
      return
    }

    hasTrackedViewRef.current = true
    track(APP_EVENT.wishlistView, { entry_point: entryPoint })
  }, [entryPoint, hasHydrated])

  if (!hasHydrated) {
    return null
  }

  if (items.length === 0) {
    return (
      <div className="layout-empty">
        <p>찜한 상품이 없습니다.</p>
        <Link href="/products">상품 보러 가기</Link>
      </div>
    )
  }

  return <ProductGrid products={items} titleLevel={2} />
}
