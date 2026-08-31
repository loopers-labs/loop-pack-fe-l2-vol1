import { sessionResponseSchema } from '@/entities/auth/model/types';
import type {
  LoginRequest,
  SessionResponse,
} from '@/entities/auth/model/types';

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message;
  }

  return fallback;
}

async function readBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

export async function login(
  request: LoginRequest,
): Promise<SessionResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  const body = await readBody(response);

  if (!response.ok) {
    throw new AuthApiError(
      getErrorMessage(body, '로그인에 실패했습니다.'),
      response.status,
    );
  }

  const result = sessionResponseSchema.safeParse(body);
  if (!result.success) {
    throw new AuthApiError('로그인 응답을 확인하지 못했습니다.', 500);
  }

  return result.data;
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', { method: 'POST' });

  if (!response.ok) {
    const body = await readBody(response);
    throw new AuthApiError(
      getErrorMessage(body, '로그아웃에 실패했습니다.'),
      response.status,
    );
  }
}
