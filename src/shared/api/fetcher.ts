import type { ApiErrorResponse } from '@/shared/types/api';

type QueryValue = string | number;

type FetcherOptions = {
  query?: Record<string, QueryValue | undefined>;
  // TanStack Query가 queryFn에 넘겨주는 AbortSignal을 fetch까지 연결하기 위한 통로.
  // 연결해야 query key가 바뀔 때 이전 요청이 실제로 취소된다.
  signal?: AbortSignal;
  // [AI] 1-1 로그인 연동 추가. body가 있으면 Content-Type: application/json 헤더와
  // JSON 직렬화 본문을 실어 보낸다. 모든 POST가 이 관문을 타야 공통 에러 처리가 유지된다.
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export const buildQueryString = (query?: FetcherOptions['query']): string => {
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

// [AI] 세션 만료 전용 에러 (week-09 1-4). 전역 처리기(QueryProvider)가 이 타입만 골라
// 만료 절차(정리 → 안내 → 로그인 이동)를 수행한다 — 화면마다 401을 해석하지 않도록.
export class SessionExpiredError extends ApiError {
  constructor() {
    // 서버 401 본문("로그인이 필요합니다.")은 두 얼굴(미로그인/만료)이 섞인 애매한 문구라
    // 만료로 분류된 시점엔 만료 안내 문구로 교체한다 (RFC 401 두 얼굴 구분 기준).
    super('세션이 만료되었어요. 다시 로그인해 주세요.', 401);
    this.name = 'SessionExpiredError';
  }
}

// [AI] 공통 요청 관문: 요청 실행 + HTTP 에러를 ApiError로 변환까지를 한 곳에서 처리한다.
// 모든 서버 요청(apiFetch, apiFetchEmpty)이 이 관문을 지난다.
const request = async (path: string, options?: FetcherOptions): Promise<Response> => {
  const hasBody = options?.body !== undefined;
  const response = await fetch(`${getBaseUrl()}${path}${buildQueryString(options?.query)}`, {
    method: options?.method,
    signal: options?.signal,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    // [AI] 만료 감지는 이 관문(한 곳)에서 한다 (RFC 만료 처리 위치 결정 — "감지는 fetcher").
    // 보호 API의 401만 만료로 분류하고, auth 엔드포인트의 401은 제외한다:
    //   /api/auth/login의 401 = 자격 증명 실패, /api/auth/me의 401 = 로그인 안 함 (정상 답변).
    // 모든 요청이 이 관문을 지나므로 query/mutation/일반 fetch 어디서 터져도 커버된다.
    if (response.status === 401 && !path.startsWith('/api/auth')) {
      throw new SessionExpiredError();
    }

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

  return response;
};

// response.json()은 Promise<any>를 반환하므로, 별도의 타입 단언 없이
// 반환 타입 Promise<T>로 직접 할당 가능하다. (eslint consistent-type-assertions: never 대응)
export const apiFetch = async <T>(path: string, options?: FetcherOptions): Promise<T> => {
  const response = await request(path, options);
  return response.json();
};

// [AI] 본문이 없는 응답(204 No Content — 로그아웃)용. json() 파싱이 없어 204를 안전하게 처리한다.
export const apiFetchEmpty = async (path: string, options?: FetcherOptions): Promise<void> => {
  await request(path, options);
};
