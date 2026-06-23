import type {
  AddressData,
  CartItemData,
  CouponData,
  MemberData,
  PastOrderData,
} from '../model'

const CART: Array<CartItemData> = [
  {
    id: 'p1',
    name: '무지 코튼 반팔티',
    option: '차콜 / M',
    price: 19000,
    quantity: 2,
    thumbnail: '👕',
  },
  {
    id: 'p2',
    name: '데일리 캔버스 토트백',
    option: '아이보리',
    price: 27000,
    quantity: 1,
    thumbnail: '👜',
  },
]

const COUPONS: Array<CouponData> = [
  { code: 'WELCOME5000', label: '신규 가입 5,000원 할인', discount: 5000 },
  { code: 'SUMMER3000', label: '여름맞이 3,000원 할인', discount: 3000 },
]

const ADDRESSES: Array<AddressData> = [
  {
    id: 'a1',
    label: '집',
    recipient: '김루퍼',
    detail: '서울시 강남구 테헤란로 1',
    isRemote: false,
  },
  {
    id: 'a2',
    label: '회사',
    recipient: '김루퍼',
    detail: '서울시 성동구 성수일로 10',
    isRemote: false,
  },
  {
    id: 'a3',
    label: '본가',
    recipient: '김부모',
    detail: '제주시 첨단로 200',
    isRemote: true,
  },
]

const MEMBER: MemberData = { name: '김루퍼', grade: 'VIP', point: 4200 }

const PAST_ORDERS: Array<PastOrderData> = [
  {
    id: 'o1',
    summary: '나이키 에어포스 외 1건',
    status: 'shipped',
    amount: 138000,
  },
  {
    id: 'o2',
    summary: '아메리카노 원두 1kg',
    status: 'delivered',
    amount: 21000,
  },
  { id: 'o3', summary: '무선 마우스', status: 'cancelled', amount: 32000 },
]

type MarketSnapshotData = {
  cartItems: Array<CartItemData>
  coupons: Array<CouponData>
  addresses: Array<AddressData>
  member: MemberData
  pastOrders: Array<PastOrderData>
}

export class MarketRepository {
  getCartItems(): Array<CartItemData> {
    return CART
  }

  getCoupons(): Array<CouponData> {
    return COUPONS
  }

  getAddresses(): Array<AddressData> {
    return ADDRESSES
  }

  getMember(): MemberData {
    return MEMBER
  }

  getPastOrders(): Array<PastOrderData> {
    return PAST_ORDERS
  }

  getMarketSnapshot(): MarketSnapshotData {
    return {
      cartItems: this.getCartItems(),
      coupons: this.getCoupons(),
      addresses: this.getAddresses(),
      member: this.getMember(),
      pastOrders: this.getPastOrders(),
    }
  }
}
