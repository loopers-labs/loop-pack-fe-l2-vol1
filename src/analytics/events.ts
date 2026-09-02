import { identify, reset, track } from './logger';
import { setAnalyticsUserId } from './context';
import type { LoginFrom } from '@/shared/lib/loginFrom';

export const ANALYTICS_EVENT_NAMES = {
  productListView: 'product_list_view',
  productDetailView: 'product_detail_view',
  cartAdd: 'cart_add',
  loginStart: 'login_start',
  loginSuccess: 'login_success',
  loginFail: 'login_fail',
  orderStart: 'order_start',
  orderComplete: 'order_complete',
} as const;

interface ProductListViewProperties {
  category: string;
  sort: string;
  page: number;
}

interface OrderProperties {
  productIds: string[];
  itemCount: number;
  totalPrice: number;
}

interface OrderCompleteProperties extends OrderProperties {
  orderId: string;
}

export function getLoginFailureReason(status?: number): string {
  if (status === 401) return 'INVALID_CREDENTIALS';
  if (status === 400) return 'INVALID_REQUEST';
  if (status !== undefined && status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN_ERROR';
}

export function trackProductListView(
  properties: ProductListViewProperties,
): void {
  track(ANALYTICS_EVENT_NAMES.productListView, { ...properties });
}

export function trackProductDetailView(productId: string): void {
  track(ANALYTICS_EVENT_NAMES.productDetailView, { productId });
}

export function trackCartAdd(productId: string, quantity = 1): void {
  track(ANALYTICS_EVENT_NAMES.cartAdd, { productId, quantity });
}

export function trackLoginStart(from: LoginFrom): void {
  track(ANALYTICS_EVENT_NAMES.loginStart, { from });
}

export function identifyAnalyticsUser(userId: string): void {
  setAnalyticsUserId(userId);
  identify(userId);
}

export function trackLoginSuccess(from: LoginFrom): void {
  track(ANALYTICS_EVENT_NAMES.loginSuccess, { from });
}

export function trackLoginFail(from: LoginFrom, reason: string): void {
  track(ANALYTICS_EVENT_NAMES.loginFail, { from, reason });
}

export function trackOrderStart(properties: OrderProperties): void {
  track(ANALYTICS_EVENT_NAMES.orderStart, { ...properties });
}

export function trackOrderComplete(
  properties: OrderCompleteProperties,
): void {
  track(ANALYTICS_EVENT_NAMES.orderComplete, { ...properties });
}

export function resetAnalyticsUser(): void {
  reset();
  setAnalyticsUserId(null);
}
