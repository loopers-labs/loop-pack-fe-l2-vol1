import { Address, CartItem, Coupon, Member, PastOrder } from '../model'
import { MarketRepository } from './market.repository'

type MarketSnapshot = {
  cartItems: Array<CartItem>
  coupons: Array<Coupon>
  addresses: Array<Address>
  member: Member
  pastOrders: Array<PastOrder>
}

export class MarketService {
  constructor(private readonly repository = new MarketRepository()) {}

  getCartItems(): Array<CartItem> {
    return this.repository.getCartItems().map((item) => new CartItem(item))
  }

  getCoupons(): Array<Coupon> {
    return this.repository.getCoupons().map((coupon) => new Coupon(coupon))
  }

  getAddresses(): Array<Address> {
    return this.repository.getAddresses().map((address) => new Address(address))
  }

  getMember(): Member {
    return new Member(this.repository.getMember())
  }

  getPastOrders(): Array<PastOrder> {
    return this.repository.getPastOrders().map((order) => new PastOrder(order))
  }

  getMarketSnapshot(): MarketSnapshot {
    return {
      cartItems: this.getCartItems(),
      coupons: this.getCoupons(),
      addresses: this.getAddresses(),
      member: this.getMember(),
      pastOrders: this.getPastOrders(),
    }
  }
}
