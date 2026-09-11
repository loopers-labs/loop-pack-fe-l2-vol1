'use client'

import Image from 'next/image'
import { APP_EVENT } from '@/analytics/app-events'
import { track } from '@/analytics/logger'
import { useCartStore, type CartItem } from '@/entities/cart'
import { formatPrice } from '@/shared/lib/format-price'
import styles from './cart.module.css'

type CartItemRowProps = {
  item: CartItem
}

export const CartItemRow = ({ item }: CartItemRowProps) => {
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)

  const handleRemove = () => {
    remove(item.id)
    track(APP_EVENT.cartRemove, { product_id: item.id })
  }

  return (
    <li className={styles.item}>
      <Image className={styles.image} src={item.image} alt={item.name} width={80} height={80} />
      <div className={styles.info}>
        <p>{item.brand}</p>
        <h2>{item.name}</h2>
        <strong>{formatPrice(item.price)}</strong>
      </div>
      <div className={styles.quantity}>
        {/*
          − 는 1에서 멈춘다. POST /api/orders가 1 이상의 정수만 받으므로 0은 수량이 아니고,
          0으로 내리는 것은 삭제가 할 일이다.
        */}
        <button
          type="button"
          aria-label={`${item.name} 수량 줄이기`}
          disabled={item.quantity <= 1}
          onClick={() => setQuantity(item.id, item.quantity - 1)}
        >
          −
        </button>
        <span aria-label={`${item.name} 수량`}>{item.quantity}</span>
        <button
          type="button"
          aria-label={`${item.name} 수량 늘리기`}
          onClick={() => setQuantity(item.id, item.quantity + 1)}
        >
          +
        </button>
      </div>
      <button type="button" aria-label={`${item.name} 삭제`} onClick={handleRemove}>
        삭제
      </button>
    </li>
  )
}
