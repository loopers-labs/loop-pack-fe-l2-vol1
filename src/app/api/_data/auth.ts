export {
  accounts,
  createSessionToken,
  findAccount,
  isAuthScenario,
  readSessionToken,
  TEST_PASSWORD,
  waitForAuthApi,
} from '@/entities/session/server'
export type {
  AuthErrorResponse,
  AuthScenario,
  AuthUser,
  LoginRequest,
  SessionResponse,
} from '@/entities/session'
export type {
  Order,
  OrderCreateRequest,
  OrderCreateResponse,
  OrderItem,
  OrderListResponse,
} from '@/entities/order'
import type { Order, OrderItem } from '@/entities/order'

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const ordersByUser = new Map<string, Order[]>()
let orderSequence = 0

export const addOrder = (userId: string, items: OrderItem[]): Order => {
  orderSequence += 1

  const order: Order = {
    id: `o${orderSequence}`,
    createdAt: new Date().toISOString(),
    items,
  }

  ordersByUser.set(userId, [...(ordersByUser.get(userId) ?? []), order])
  return order
}

export const listOrders = (userId: string): Order[] =>
  ordersByUser.get(userId) ?? []

export const resetOrders = (): void => {
  ordersByUser.clear()
  orderSequence = 0
}

export const isKnownProductId = (productId: string): boolean =>
  /^p(?:[1-9]|1\d|2\d|30)$/.test(productId)
