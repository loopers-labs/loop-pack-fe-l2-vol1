export const APP_EVENT = {
  productListView: 'product_list_view',
  categoryFilterChange: 'category_filter_change',
  sortChange: 'sort_change',
  pageChange: 'page_change',
  cartAdd: 'cart_add',
  cartRemove: 'cart_remove',
  wishlistView: 'wishlist_view',
  wishlistAdd: 'wishlist_add',
  wishlistRemove: 'wishlist_remove',
  loginStart: 'login_start',
  loginSuccess: 'login_success',
  loginFail: 'login_fail',
  logoutComplete: 'logout_complete',
  orderStart: 'order_start',
  orderComplete: 'order_complete',
} as const

export const LOGIN_ENTRY_POINTS = [
  'header_wishlist',
  'header_cart',
  'header_login',
  'product_wishlist',
  'product_cart',
  'protected_route',
] as const

export type LoginEntryPoint = (typeof LOGIN_ENTRY_POINTS)[number]

export const WISHLIST_ENTRY_POINTS = ['header_wishlist', 'mypage_wishlist', 'direct'] as const

export type WishlistEntryPoint = (typeof WISHLIST_ENTRY_POINTS)[number]

export const isLoginEntryPoint = (value: unknown): value is LoginEntryPoint =>
  typeof value === 'string' && LOGIN_ENTRY_POINTS.some((entryPoint) => entryPoint === value)

export const isWishlistEntryPoint = (value: unknown): value is WishlistEntryPoint =>
  typeof value === 'string' && WISHLIST_ENTRY_POINTS.some((entryPoint) => entryPoint === value)
