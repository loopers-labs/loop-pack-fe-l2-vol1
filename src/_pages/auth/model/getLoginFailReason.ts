import { ApiError } from '@/shared/api/fetcher';

export type LoginFailReason = 'INVALID_CREDENTIALS' | 'INVALID_FORMAT' | 'UNKNOWN';

export const getLoginFailReason = (error: unknown): LoginFailReason => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'INVALID_CREDENTIALS';
    }
    if (error.status === 400) {
      return 'INVALID_FORMAT';
    }
  }
  return 'UNKNOWN';
};
