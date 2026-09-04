'use client'

import { useRouter } from 'next/navigation'
import { APP_EVENT } from '@/analytics/app-events'
import { clearFlowId, getFlowId } from '@/analytics/browser-context'
import { track } from '@/analytics/logger'
import { selectCartItems, useCartStore } from '@/entities/cart'
import { useCreateOrderMutation } from '@/entities/order'
import styles from './PlaceOrderButton.module.css'

// 주문은 사용자가 수행하는 비즈니스 행위라 feature가 소유한다.
// 두 entity(장바구니·주문)를 잇는 자리도 여기다 — entity끼리는 서로를 참조할 수 없다.
export const PlaceOrderButton = () => {
  const router = useRouter()
  const items = useCartStore(selectCartItems)
  const clearAll = useCartStore((state) => state.clearAll)
  const { mutate, isPending, error } = useCreateOrderMutation()

  const handleClick = () => {
    // 서버 계약에는 productId와 수량만 싣는다. 표시 정보는 화면용이다.
    const orderItems = items.map((item) => ({ productId: item.id, quantity: item.quantity }))
    const productIds = items.map((item) => item.id)
    const flowId = getFlowId()

    track(APP_EVENT.orderStart, {
      ...(flowId === undefined ? {} : { flow_id: flowId }),
      product_ids: productIds,
    })

    mutate(orderItems, {
      onSuccess: ({ order }) => {
        track(APP_EVENT.orderComplete, {
          ...(flowId === undefined ? {} : { flow_id: flowId }),
          order_id: order.id,
          product_ids: productIds,
        })
        clearFlowId()
        clearAll()
        router.push('/orders')
      },
    })
  }

  return (
    <div className={styles.wrapper}>
      <button type="button" disabled={items.length === 0 || isPending} onClick={handleClick}>
        {isPending ? '주문 중…' : '주문하기'}
      </button>
      {/*
        오류 영역은 한 자리에 고정한다. 400(요청 형식)과 500(서버)이 같은 자리에 뜨고,
        role="alert"라 스크린리더와 E2E가 같은 것을 본다.
      */}
      <p className={styles.error} role="alert">
        {error === null ? '' : error.message}
      </p>
    </div>
  )
}
