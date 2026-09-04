import { identify, reset, track } from './logger';

export type LoginFailReason = 'INVALID_CREDENTIALS' | 'INVALID_FORMAT' | 'UNKNOWN';

export const logProductListView = (): void => {
  track('product_list_view');
};

export const logCartAdd = (productId: string): void => {
  track('cart_add', { productId });
};

export const logLoginStart = (): void => {
  track('login_start');
};

export const logLoginSuccess = (userId: string): void => {
  identify(userId);
  track('login_success');
};

export const logLoginFail = (reason: LoginFailReason): void => {
  track('login_fail', { reason });
};

export const resetUserIdentity = (): void => {
  reset();
};
