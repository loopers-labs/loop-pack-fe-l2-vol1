import { track } from './logger'

export type LoginEventSource = 'header' | 'protected' | 'expired'

export type LoginFailReason =
  | 'invalid_credentials'
  | 'invalid_request'
  | 'server_error'
  | 'network_error'

export const analyticsEvents = {
  productListView: (properties: {
    readonly category: string
    readonly sort: string
    readonly page: number
  }) => {
    track('product_list_view', properties)
  },
  cartAdd: (properties: { readonly productId: string }) => {
    track('cart_add', properties)
  },
  loginStart: (properties: { readonly from: LoginEventSource }) => {
    track('login_start', properties)
  },
  loginSuccess: (properties: { readonly from: LoginEventSource }) => {
    track('login_success', properties)
  },
  loginFail: (properties: { readonly reason: LoginFailReason }) => {
    track('login_fail', properties)
  },
  orderStart: (properties: {
    readonly itemCount: number
    readonly productIds: ReadonlyArray<string>
  }) => {
    track('order_start', properties)
  },
  orderComplete: (properties: {
    readonly orderId: string
    readonly itemCount: number
    readonly productIds: ReadonlyArray<string>
  }) => {
    track('order_complete', properties)
  },
} as const
