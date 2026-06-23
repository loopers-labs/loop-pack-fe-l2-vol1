import type { CartItemData } from '../types'

export class CartItem {
  readonly id: string
  readonly name: string
  readonly option: string
  readonly price: number
  readonly quantity: number
  readonly thumbnail: string

  constructor(data: CartItemData) {
    this.id = data.id
    this.name = data.name
    this.option = data.option
    this.price = data.price
    this.quantity = data.quantity
    this.thumbnail = data.thumbnail
  }

  get totalPrice() {
    return this.price * this.quantity
  }
}
