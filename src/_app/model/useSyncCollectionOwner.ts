'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/entities/cart'
import { useCurrentUserId } from '@/entities/session'
import { useWishlistStore } from '@/entities/wishlist'

// 두 store의 소유자를 세션에 맞춘다. setOwner를 부르는 유일한 자리다 —
// 한쪽만 부르는 실수가 구조로 막히지는 않지만, 부르는 곳이 하나면 실수할 자리도 하나다.
//
// 저장된 것은 데이터(byOwner)이고 지금 누구인지는 매 로드마다 세션이 정한다는 규칙이
// (docs/week-09/decisions.md 8번) 실제로 지켜지는 곳이 여기다. 로그인 시점에만 부르면
// 새로고침한 브라우저가 자기 목록을 잃는다.
//
// 파생값을 state로 복사하는 종류의 effect가 아니라, React 상태를 외부 store에 반영하는
// effect다. React 문서가 드는 effect의 정당한 용도가 이것이다.
//
// 렌더 중에 부르지 않는 것은 그것이 부수 효과이기 때문이다. store 구독은 필요 없어
// (읽는 게 아니라 쓰기만 한다) getState()로 명령형 경계에서만 건드린다.
export const useSyncCollectionOwner = () => {
  const currentUserId = useCurrentUserId()

  useEffect(() => {
    useCartStore.getState().setOwner(currentUserId)
    useWishlistStore.getState().setOwner(currentUserId)
  }, [currentUserId])
}
