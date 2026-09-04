'use client'

import { selectHasCartOwner, useCartStore } from '@/entities/cart'
import type { ProductSummary } from '@/entities/product'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { APP_EVENT } from '@/analytics/app-events'
import { track } from '@/analytics/logger'
import { toLoginPath } from '@/shared/lib/to-login-path'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog/ConfirmDialog'
import styles from './AddCartButton.module.css'

type AddCartButtonProps = {
  product: ProductSummary
}

// 담기만 한다. 제거는 장바구니 화면이 맡는다.
//
// aria-pressed를 뗐다. 수량이 생기면서 "다시 누르면 빠진다"가 성립하지 않게 됐고
// (수량 3에서 다시 누르면?), 눌린 상태를 표시할 대상이 사라졌다. 이제 누를 때마다 수량이 하나 오른다.
//
// id만이 아니라 상품 전체를 받는 것은 store가 담은 시점의 표시 정보를 함께 들기 때문이다.
// 장바구니·주문서가 상품을 그려야 하는데 상품을 id로 조회하는 API가 없다.
export const AddCartButton = ({ product }: AddCartButtonProps) => {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const addToCart = useCartStore((state) => state.add)
  const hasOwner = useCartStore(selectHasCartOwner)

  // 미로그인이면 담지 않고 로그인으로 보낸다(docs/week-09/decisions.md 3번).
  // store도 소유자가 없으면 스스로 막지만, 막기만 하면 버튼이 고장 난 것과 구별되지 않는다.
  // 막는 것은 store, 다음 갈 곳을 정하는 것은 이 행위의 몫이다.
  //
  // 현재 경로를 usePathname·useSearchParams가 아니라 클릭 시점의 window.location에서 읽는다.
  // useSearchParams는 Suspense 경계 밖에서 부르면 그 페이지 전체가 클라이언트 렌더로 내려가는데,
  // 이 버튼은 홈과 상품 목록 카드 안에 있어 그 대가가 화면 전체에 걸린다.
  const handleClick = () => {
    if (!hasOwner) {
      const { pathname, search } = window.location
      window.location.assign(
        toLoginPath(`${pathname}${search}`, {
          entryPoint: 'product_cart',
          productId: product.id,
        }),
      )
      return
    }

    addToCart(product)
    track(APP_EVENT.cartAdd, { product_id: product.id, quantity: 1 })
    setIsConfirmOpen(true)
  }

  const handleClose = () => {
    setIsConfirmOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.button}
        type="button"
        aria-label={`${product.name} 장바구니`}
        onClick={handleClick}
      >
        담기
      </button>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="장바구니 페이지로 이동하겠습니까?"
        confirmLabel="장바구니 이동"
        onCancel={handleClose}
        onConfirm={() => {
          setIsConfirmOpen(false)
          // 전체 새로고침이 아니라 클라이언트 전환이다. 미로그인 분기의 location.assign과 다른데,
          // 그쪽은 헤더가 서버에서 세션을 읽어야 해서 새 문서가 필요하고 여기는 그렇지 않다.
          router.push('/cart')
        }}
      />
    </>
  )
}
