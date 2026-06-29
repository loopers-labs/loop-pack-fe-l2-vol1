import type { OrderStatus } from './OrderStatus'

export type PastOrderDto = {
  id: string
  summary: string
  status: OrderStatus
  amount: number
}
