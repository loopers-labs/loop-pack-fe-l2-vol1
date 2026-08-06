import type { ApiErrorResponse } from '@/shared/types/api';

type QueryValue = string | number;

type FetcherOptions = {
  query?: Record<string, QueryValue | undefined>;
  // TanStack Query가 queryFn에 넘겨주는 AbortSignal을 fetch까지 연결하기 위한 통로.
  // 연결해야 query key가 바뀔 때 이전 요청이 실제로 취소된다.
  signal?: AbortSignal;
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

// [AI] 서버(Node.js) fetch는 상대 URL을 처리하지 못하므로 절대 URL이 필요하다.
// 브라우저에서는 빈 문자열을 써서 상대 URL 그대로 동작하게 한다.
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
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
  const response = await fetch(`${getBaseUrl()}${path}${buildQueryString(options?.query)}`, {
    signal: options?.signal,
  });

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
