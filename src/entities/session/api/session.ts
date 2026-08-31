import { ApiError } from '@/shared/api';
import type { AuthUser } from '@/entities/session/model';

type LoginInput = {
  email: string;
  password: string;
};

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getMe(): Promise<AuthUser> {
  const response = await fetch('/api/auth/me');
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
