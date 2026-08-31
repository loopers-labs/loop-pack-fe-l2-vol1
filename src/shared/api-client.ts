import { environmentManager } from '@tanstack/react-query';

import { getAppOrigin } from './app-origin';
import { HTTP_STATUS } from './http-status';

/**
 * HTTP 실패 응답. status를 남겨 호출부와 React Query가 401 같은 상태 코드로 분기하게 한다.
 * 메시지는 에러 화면에 그대로 노출되므로 사용자용 문구만 담는다.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isUnauthorizedError = (error: unknown) =>
  error instanceof ApiError && error.status === HTTP_STATUS.UNAUTHORIZED;

/**
 * 공용 API Client
 * fetch는 4xx/5xx에서 에러를 던지지 않으므로 response.ok를 검사해 throw한다.
 * 서버에서도 쓰는 계층이라 router·store 조작 같은 부수 효과는 두지 않는다.
 */
export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = resolveRequestUrl(path);
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    throw new Error(
      '네트워크에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    );
  }

  // 204 No Content는 HTTP 규약상 본문이 없으므로 파싱하지 않는다.
  if (response.status === HTTP_STATUS.NO_CONTENT) return undefined as T;

  // 성공이든 실패든 본문에서 값을 꺼내므로 한 번만 파싱하고, 파싱 실패는 null로 둔다.
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiMessage = (body as { message?: string } | null)?.message;

    throw new ApiError(
      response.status,
      apiMessage ?? `요청에 실패했습니다. (HTTP ${response.status})`,
    );
  }

  if (body === null) {
    throw new Error('응답을 처리하지 못했습니다.');
  }

  return body as T;
}

/**
 * 브라우저는 상대 경로를 현재 origin으로 해석하지만 서버 fetch는 해석하지 못한다.
 * 서버에서만 APP_ORIGIN을 붙여 호출부가 한 벌의 상대 경로를 그대로 쓰게 한다.
 */
function resolveRequestUrl(path: string) {
  if (!environmentManager.isServer()) return path;

  const origin = getAppOrigin();

  if (!origin) {
    throw new Error(
      '서버에서 API 주소를 만들지 못했습니다. APP_ORIGIN을 확인해주세요.',
    );
  }

  return new URL(path, origin).toString();
}
