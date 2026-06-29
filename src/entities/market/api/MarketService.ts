import { Address, CartItem, Coupon, Member, PastOrder } from '../model'
import { MarketRepository } from './MarketRepository'

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
}
