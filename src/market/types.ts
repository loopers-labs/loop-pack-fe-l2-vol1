export type CartItem = {
  id: string
  name: string
  option: string // 예: "차콜 / M"
  price: number
  quantity: number
  thumbnail: string // 이모지
}

export type Coupon = {
  code: string
  label: string
  discount: number // 정액 할인(원)
}

export type Address = {
  id: string
  label: string // "집", "회사"
  recipient: string
  detail: string
  isRemote: boolean // 도서산간 → 배송비 추가
}

export type PaymentMethod = 'card' | 'transfer' | 'kakao'

export type Member = {
  name: string
  grade: 'VIP' | 'NORMAL'
  point: number // 보유 적립금
}

export type OrderStatus = 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export type PastOrder = {
  id: string
  summary: string
  status: OrderStatus
  amount: number
}
