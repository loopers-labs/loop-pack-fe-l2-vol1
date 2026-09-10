'use client'

import { trackCartAdd } from '@/analytics/events'
import { useIsInCart, useToggleCart } from '@/entities/cart/model/cart'

interface CartToggleButtonProps {
  productId: string
  productName: string
}

// 담기 행위만 담당한다. 자기 상품의 포함 여부(boolean)와 action만 구독하므로
// 다른 상품을 토글해도 리렌더되지 않는다.
// 같은 슬라이스의 model을 참조하는 것은 세그먼트 간 협력이라 의존 규칙에 어긋나지 않는다.
export default function CartToggleButton({
  productId,
  productName,
}: CartToggleButtonProps) {
  const isInCart = useIsInCart(productId)
  const toggleCart = useToggleCart()

  return (
    <button
      type="button"
      aria-label={`${productName} bag`}
      aria-pressed={isInCart}
      onClick={() => {
        toggleCart(productId)
        // 담을 때만 보낸다. 시드 로그에 담기 해제에 해당하는 이름이 없어,
        // 새 이름을 만들면 그 로그로 세운 순위와 이어 볼 수 없다.
        if (!isInCart) trackCartAdd({ productId })
      }}
    >
      {isInCart ? 'Remove' : 'Add to bag'}
    </button>
  )
}
