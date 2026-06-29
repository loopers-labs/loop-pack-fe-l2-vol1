import type { CartItemDto } from '../types'

export class CartItem {
  readonly id: string
  readonly name: string
  readonly option: string
  readonly price: number
  readonly quantity: number
  readonly thumbnail: string

  constructor(cartItemDto: CartItemDto) {
    this.id = cartItemDto.id
    this.name = cartItemDto.name
    this.option = cartItemDto.option
    this.price = cartItemDto.price
    this.quantity = cartItemDto.quantity
    this.thumbnail = cartItemDto.thumbnail
  }

  get totalPrice() {
    return this.price * this.quantity
  }
}
