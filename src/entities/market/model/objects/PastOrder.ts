import type { OrderStatus, PastOrderDto } from '../types'

export class PastOrder {
  readonly id: string
  readonly summary: string
  readonly status: OrderStatus
  readonly amount: number

  constructor(pastOrderDto: PastOrderDto) {
    this.id = pastOrderDto.id
    this.summary = pastOrderDto.summary
    this.status = pastOrderDto.status
    this.amount = pastOrderDto.amount
  }
}
