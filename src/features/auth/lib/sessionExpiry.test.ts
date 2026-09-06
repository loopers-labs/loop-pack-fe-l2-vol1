import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/shared/api/HttpError';
import { protectedRequestMeta } from '@/shared/api/requestMeta';
import { handleSessionExpiry } from './sessionExpiry';

const navigation = vi.hoisted(() => ({
  redirectToLogin: vi.fn(),
}));

vi.mock('./authNavigation', () => navigation);

describe('handleSessionExpiry', () => {
  beforeEach(() => {
    navigation.redirectToLogin.mockReset();
  });

  it('보호 요청의 401만 로그인 이동으로 처리한다', () => {
    handleSessionExpiry(
      new HttpError('로그인이 필요합니다.', 401),
      protectedRequestMeta,
    );

    expect(navigation.redirectToLogin).toHaveBeenCalledOnce();
  });

  it('일반 요청이나 다른 HTTP 오류는 화면 정책으로 처리하지 않는다', () => {
    handleSessionExpiry(new HttpError('로그인 실패', 401), undefined);
    handleSessionExpiry(new HttpError('서버 오류', 500), protectedRequestMeta);

    expect(navigation.redirectToLogin).not.toHaveBeenCalled();
  });
});
