import type { AuthUser, LoginRequest, SessionResponse } from '@/types/auth';
import { HttpError, InvalidResponseError } from '@/shared/api/errors';
import { apiUrl } from '@/shared/api/base-url';

function isSessionResponse(data: unknown): data is SessionResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'user' in data &&
    typeof data.user === 'object' &&
    data.user !== null &&
    'id' in data.user &&
    typeof data.user.id === 'string' &&
    'name' in data.user &&
    typeof data.user.name === 'string' &&
    'email' in data.user &&
    typeof data.user.email === 'string'
  );
}

// 실패 응답의 { message }를 읽는다. 형식이 다르면 undefined — 호출자가 기본 문구를 쓴다.
async function readErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const body: unknown = await res.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
    ) {
      return body.message;
    }
  } catch {
    // 본문이 JSON이 아니면 문구 없이 상태 코드만 전달한다.
  }
  return undefined;
}

async function parseSession(res: Response): Promise<AuthUser> {
  const data: unknown = await res.json();
  if (!isSessionResponse(data)) {
    throw new InvalidResponseError('세션 응답 형식이 올바르지 않습니다.');
  }
  return data.user;
}

export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    // 401(자격 증명 불일치)의 문구는 서버가 정한다 — 화면은 그대로 보여준다.
    // 그 외(400·500)는 사용자가 고칠 수 없는 실패라 한 문구로 묶는다.
    const message =
      res.status === 401
        ? await readErrorMessage(res)
        : '로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.';
    throw new HttpError(
      res.status,
      message ?? '이메일 또는 비밀번호를 확인해주세요.',
    );
  }

  return parseSession(res);
}

// 현재 세션. 401은 "로그인 안 함"으로 읽어 null — 이 요청은 모든 화면(헤더)에서 나가므로
// 여기서의 401을 만료로 단정할 수 없다. 만료 판정은 보호 경로 데이터의 401이 맡는다 (RFC D5).
export async function getSession(): Promise<AuthUser | null> {
  const res = await fetch(apiUrl('/api/auth/me'));
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new HttpError(res.status, '세션을 확인하지 못했습니다.');
  }
  return parseSession(res);
}

export async function logout(): Promise<void> {
  const res = await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
  if (!res.ok) {
    throw new HttpError(res.status, '로그아웃하지 못했습니다.');
  }
}
