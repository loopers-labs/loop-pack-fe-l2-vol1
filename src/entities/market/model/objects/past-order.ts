import type { OrderStatus, PastOrderData } from '../types'

export class PastOrder {
  readonly id: string
  readonly summary: string
  readonly status: OrderStatus
  readonly amount: number

  constructor(data: PastOrderData) {
    this.id = data.id
    this.summary = data.summary
    this.status = data.status
    this.amount = data.amount
  }
}
