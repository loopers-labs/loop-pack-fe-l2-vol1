'use client'

import { useSyncExternalStore, type JSX } from 'react'
import { useRouter } from 'next/navigation'
import { trackOrderComplete, trackOrderStart } from '@/analytics/events'
import {
  useCaptureCartSnapshot,
  useCartIds,
  useRemoveCartSnapshot,
} from '@/entities/cart'
import type { Order, OrderItem } from '@/entities/order'
import {
  getOrderSubmissionSnapshot,
  startOrderSubmission,
  subscribeToOrderSubmission,
} from '@/entities/order'
import { ApiError } from '@/shared/api/apiError'
import { createOrder } from '../api/ordersClient'

const DEFAULT_ERROR_MESSAGE = '주문에 실패했습니다.'

export function CreateOrderButton(): JSX.Element {
  const router = useRouter()
  const cartIds = useCartIds()
  const captureCartSnapshot = useCaptureCartSnapshot()
  const removeCartSnapshot = useRemoveCartSnapshot()
  const submission = useSyncExternalStore(
    subscribeToOrderSubmission,
    getOrderSubmissionSnapshot,
    getOrderSubmissionSnapshot,
  )
  const errorMessage =
    submission.error === null
      ? null
      : submission.error instanceof ApiError
        ? submission.error.message
        : DEFAULT_ERROR_MESSAGE

  const handleCreateOrder = (): void => {
    if (submission.isPending || cartIds.length === 0) {
      return
    }

    const submittedCartSnapshot = captureCartSnapshot()
    const items: OrderItem[] = submittedCartSnapshot.map((item) => ({
      productId: item.productId,
      quantity: 1,
    }))
    const submittedProductIds = submittedCartSnapshot.map(
      ({ productId }) => productId,
    )
    const submittedItemCount = submittedProductIds.length
    let submittedOrder: Order | undefined

    startOrderSubmission({
      submit: async (signal) => {
        trackOrderStart({
          productIds: submittedProductIds,
          itemCount: submittedItemCount,
        })
        submittedOrder = await createOrder(items, signal)
      },
      onSuccess: () => {
        if (submittedOrder === undefined) {
          return
        }

        trackOrderComplete({
          orderId: submittedOrder.id,
          productIds: submittedProductIds,
          itemCount: submittedItemCount,
        })
        removeCartSnapshot(submittedCartSnapshot)
        router.push('/orders')
      },
    })
  }

  return (
    <div className="commerce-order-action">
      {cartIds.length === 0 && (
        <p className="commerce-empty">장바구니가 비어 있습니다.</p>
      )}
      {errorMessage !== null && (
        <p className="commerce-inline-error" role="alert">
          {errorMessage}
        </p>
      )}
      <button
        className="commerce-primary-button"
        disabled={cartIds.length === 0 || submission.isPending}
        onClick={handleCreateOrder}
        type="button"
      >
        {submission.isPending ? '주문 중' : '주문하기'}
      </button>
    </div>
  )
}
