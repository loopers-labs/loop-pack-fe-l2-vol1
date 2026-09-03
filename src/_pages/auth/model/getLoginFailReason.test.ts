import { describe, it, expect } from 'vitest';
import { ApiError } from '@/shared/api/fetcher';
import { getLoginFailReason } from './getLoginFailReason';

describe('getLoginFailReason', () => {
  it('401(자격 증명 불일치)이면 INVALID_CREDENTIALS를 돌려준다', () => {
    const reason = getLoginFailReason(new ApiError('이메일 또는 비밀번호를 확인해주세요.', 401));

    expect(reason).toBe('INVALID_CREDENTIALS');
  });

  it('400(형식 오류)이면 INVALID_FORMAT을 돌려준다 — 401과 다른 이유', () => {
    const reason = getLoginFailReason(new ApiError('요청 조건을 확인해주세요.', 400));

    expect(reason).toBe('INVALID_FORMAT');
    expect(reason).not.toBe(getLoginFailReason(new ApiError('확인해주세요.', 401)));
  });

  it('그 외(5xx, 네트워크 오류)는 UNKNOWN을 돌려준다', () => {
    expect(getLoginFailReason(new ApiError('서버 오류', 500))).toBe('UNKNOWN');
    expect(getLoginFailReason(new TypeError('fetch failed'))).toBe('UNKNOWN');
  });
});
