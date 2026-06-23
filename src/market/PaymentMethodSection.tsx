import { useState } from 'react'
import type { PaymentMethod } from './types'

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
}

export function PaymentMethodSection() {
  const [payment, setPayment] = useState<PaymentMethod>('card')

  return (
    <div className="section">
      <h2>결제수단</h2>
      {(['card', 'transfer', 'kakao'] as PaymentMethod[]).map((m) => (
        <label key={m}>
          <input type="radio" checked={payment === m} onChange={() => setPayment(m)} />
          {PAYMENT_LABEL[m]}
        </label>
      ))}
    </div>
  )
}
