'use client'

import { selectHasCartOwner, useCartStore } from '@/entities/cart'
import type { ProductSummary } from '@/entities/product'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/shared/config/routes'
import { useRef, useState } from 'react'
import { APP_EVENT } from '@/analytics/app-events'
import { track } from '@/analytics/logger'
import { toLoginPath } from '@/shared/lib/to-login-path'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog/ConfirmDialog'
import styles from './AddCartButton.module.css'

type AddCartButtonProps = {
  product: ProductSummary
}

/*
  담기는 추가만 담당하고 제거는 장바구니 화면이 맡는다.
  상품 정보는 store가 담은 시점의 표시 정보를 보존하기 위해 전체 객체로 받는다.
*/
export const AddCartButton = ({ product }: AddCartButtonProps) => {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const addToCart = useCartStore((state) => state.add)
  const hasOwner = useCartStore(selectHasCartOwner)

  /* 미로그인 차단과 로그인 복귀 경로 생성은 이 feature가 담당한다. */
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
          router.push(ROUTES.CART)
        }}
      />
    </>
  )
}
