import type { Address, CartItem, Coupon, Member, PastOrder } from './types'

export const CART: CartItem[] = [
  { id: 'p1', name: '무지 코튼 반팔티', option: '차콜 / M', price: 19000, quantity: 2, thumbnail: '👕' },
  { id: 'p2', name: '데일리 캔버스 토트백', option: '아이보리', price: 27000, quantity: 1, thumbnail: '👜' },
]

export const COUPONS: Coupon[] = [
  { code: 'WELCOME5000', label: '신규 가입 5,000원 할인', discount: 5000 },
  { code: 'SUMMER3000', label: '여름맞이 3,000원 할인', discount: 3000 },
]

export const ADDRESSES: Address[] = [
  { id: 'a1', label: '집', recipient: '김루퍼', detail: '서울시 강남구 테헤란로 1', isRemote: false },
  { id: 'a2', label: '회사', recipient: '김루퍼', detail: '서울시 성동구 성수일로 10', isRemote: false },
  { id: 'a3', label: '본가', recipient: '김부모', detail: '제주시 첨단로 200', isRemote: true },
]

export const MEMBER: Member = { name: '김루퍼', grade: 'VIP', point: 4200 }

export const PAST_ORDERS: PastOrder[] = [
  { id: 'o1', summary: '나이키 에어포스 외 1건', status: 'shipped', amount: 138000 },
  { id: 'o2', summary: '아메리카노 원두 1kg', status: 'delivered', amount: 21000 },
  { id: 'o3', summary: '무선 마우스', status: 'cancelled', amount: 32000 },
]
