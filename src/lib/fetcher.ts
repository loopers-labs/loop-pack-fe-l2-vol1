import type { ApiErrorResponse } from '@/types/commerce';

type QueryValue = string | number;

type FetcherOptions = {
  query?: Record<string, QueryValue | undefined>;
};

const buildQueryString = (query?: FetcherOptions['query']): string => {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

// TanStack Query가 error 상태로 인식하도록 HTTP 에러를 예외로 던진다. (AI 활용)
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// response.json()은 Promise<any>를 반환하므로, 별도의 타입 단언 없이
// 반환 타입 Promise<T>로 직접 할당 가능하다. (eslint consistent-type-assertions: never 대응)
export const apiFetch = async <T>(path: string, options?: FetcherOptions): Promise<T> => {
  const response = await fetch(`${path}${buildQueryString(options?.query)}`);

  if (!response.ok) {
    let message = `요청에 실패했습니다. (status: ${response.status})`;
    try {
      const errorBody: ApiErrorResponse = await response.json();
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // 응답 본문이 JSON이 아닌 경우 기본 메시지를 유지한다.
    }
    throw new ApiError(message, response.status);
  }

  return response.json();
};
