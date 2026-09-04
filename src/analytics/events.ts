import { consoleProvider } from './consoleProvider';
import {
  initAnalytics,
  registerProviders,
  setCommonProperties,
  track,
} from './logger';

import type { CategoryId, ProductSort } from '@/entities/product';
import { ApiError } from '@/shared/api-client';
import { HTTP_STATUS } from '@/shared/http-status';

export const LOGIN_FROMS = ['cart', 'my', 'orders', 'direct'] as const;
export type LoginFrom = (typeof LOGIN_FROMS)[number];

export const LOGIN_FAIL_REASONS = [
  'INVALID_CREDENTIALS',
  'INVALID_REQUEST',
  'SERVER_ERROR',
  'UNKNOWN',
] as const;
export type LoginFailReason = (typeof LOGIN_FAIL_REASONS)[number];

export const DEVICES = ['mobile', 'tablet', 'desktop'] as const;
export type Device = (typeof DEVICES)[number];

type AnalyticsEvent =
  | {
      name: 'product_list_view';
      props: { category: CategoryId | 'all'; sort: ProductSort; page: number };
    }
  | { name: 'cart_add'; props: { productId: string; quantity: number } }
  | { name: 'login_start'; props: { from: LoginFrom } }
  | { name: 'login_success'; props: { from: LoginFrom } }
  | { name: 'login_fail'; props: { reason: LoginFailReason } }
  | { name: 'order_start'; props: { productIds: string[] } }
  | {
      name: 'order_complete';
      props: { orderId: string; productIds: string[]; totalPrice: number };
    };

export function trackEvent<Name extends AnalyticsEvent['name']>(
  name: Name,
  props: Extract<AnalyticsEvent, { name: Name }>['props'],
): void {
  ensureAnalyticsSetup();
  track(name, props);
}

export function toDevice(viewportWidth: number): Device {
  if (viewportWidth < 768) return 'mobile';
  if (viewportWidth < 1024) return 'tablet';
  return 'desktop';
}

export function toLoginFailReason(error: unknown): LoginFailReason {
  if (!(error instanceof ApiError)) return 'UNKNOWN';

  if (error.status === HTTP_STATUS.UNAUTHORIZED) return 'INVALID_CREDENTIALS';
  if (error.status === HTTP_STATUS.BAD_REQUEST) return 'INVALID_REQUEST';
  if (error.status === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    return 'SERVER_ERROR';
  }
  return 'UNKNOWN';
}

export function toLoginFrom(value: string | null): LoginFrom {
  const found = LOGIN_FROMS.find((from) => from === value);
  return found ?? 'direct';
}

const SESSION_ID_STORAGE_KEY = 'analytics_session_id';

export function readOrCreateSessionId(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): string {
  const stored = storage.getItem(SESSION_ID_STORAGE_KEY);
  if (stored) return stored;

  const created = crypto.randomUUID();
  storage.setItem(SESSION_ID_STORAGE_KEY, created);
  return created;
}

let isSetUp = false;

/**
 * 첫 계측 호출 직전에 provider와 공통 프로퍼티를 준비한다.
 * 모든 track이 trackEvent를 거치므로 공통 프로퍼티가
 * 첫 track보다 늦게 설정되는 일이 구조적으로 불가능하다.
 */
function ensureAnalyticsSetup(): void {
  if (isSetUp) return;
  isSetUp = true;

  registerProviders([consoleProvider]);
  setCommonProperties(() => ({
    sessionId: readOrCreateSessionId(window.sessionStorage),
    ts: new Date().toISOString(),
    device: toDevice(window.innerWidth),
  }));
}

/** provider 초기화. logger를 직접 부르지 않고 이 함수를 거쳐 register → init 순서를 보장한다. */
export function startAnalytics(): Promise<void> {
  ensureAnalyticsSetup();
  return initAnalytics();
}

export { identify, reset } from './logger';
