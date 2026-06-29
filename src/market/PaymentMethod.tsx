import { useState } from 'react'
import type { PaymentMethod as PaymentMethodType } from './types'

const PAYMENT_LABEL: Record<PaymentMethodType, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
}

export function PaymentMethod() {
  const [payment, setPayment] = useState<PaymentMethodType>('card')

  return (
    <div className="section">
      <h2>결제수단</h2>
      {(['card', 'transfer', 'kakao'] as PaymentMethodType[]).map((m) => (
        <label key={m}>
          <input type="radio" checked={payment === m} onChange={() => setPayment(m)} />
          {PAYMENT_LABEL[m]}
        </label>
      ))}
    </div>
  )
}
