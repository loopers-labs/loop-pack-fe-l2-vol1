import { ApiError, readErrorMessage } from '@/shared/api';
import type { AuthUser } from '@/entities/session/model';

type LoginInput = {
  email: string;
  password: string;
};

const HTTP_UNAUTHORIZED = 401;

// 헤더가 모든 페이지(보호 안 된 페이지 포함)에서 로그인 상태를 표시하는 데
// 쓰기 때문에, "로그인 안 함"은 실패가 아니라 정상 값(null)으로 다룬다.
// 그 외 실패(500 등)는 그대로 에러로 던진다.
export async function getMe(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me');
  if (response.status === HTTP_UNAUTHORIZED) {
    return null;
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readErrorMessage(response, '세션을 확인하지 못했습니다.'),
    );
  }
  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readErrorMessage(response, '로그인에 실패했습니다.'),
    );
  }
  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', { method: 'POST' });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readErrorMessage(response, '로그아웃에 실패했습니다.'),
    );
  }
}
