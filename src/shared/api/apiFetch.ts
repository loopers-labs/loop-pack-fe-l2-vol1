// AI 생성
import { getAppOrigin } from '@/shared/config/appOrigin';

export type ApiErrorResponse = {
  message: string;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

// AI 생성: week-07 3단계 — 서버(RSC/generateMetadata)는 상대 경로를 fetch할 수 없어 getAppOrigin()이
// 준 절대 URL로 요청한다. 그 origin에 닿지 않으면 이 fetch가 실제로 실패해야
// generateMetadata의 query failure(→ root 공통 metadata 상속) 시나리오를 재현할 수 있다.
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const request = typeof window === 'undefined' ? await resolveServerRequest(input, init) : { url: input, init };
  const res = await fetch(request.url, request.init);

  if (!res.ok) {
    const message = await res
      .json()
      .then((body: ApiErrorResponse) => body.message)
      .catch(() => '요청을 처리하지 못했습니다.');
    throw new ApiError(res.status, message);
  }

  return res.json();
}

// Preview는 Vercel Standard Protection 뒤에 있고, VERCEL_URL은 이 보호와 함께 쓸 수 없다(Vercel 시스템 환경 변수 문서).
// 방문자 인증 쿠키는 방문자가 연 URL 하나에만 유효하므로, 그 URL로 쿠키를 실어 self-fetch한다.
async function resolveServerRequest(input: string, init?: RequestInit): Promise<{ url: string; init?: RequestInit }> {
  if (process.env.VERCEL_ENV !== 'preview') {
    return { url: `${getAppOrigin()}${input}`, init };
  }

  // next/headers를 정적으로 import하면 이 모듈을 쓰는 클라이언트 번들에서 빌드가 깨져 서버 분기 안에서만 불러온다.
  const { headers, cookies } = await import('next/headers');
  const requestHeaders = await headers();
  const host = requestHeaders.get('host');
  if (!host) {
    return { url: `${getAppOrigin()}${input}`, init };
  }

  const forwardedHeaders = new Headers(init?.headers);
  // getMe처럼 호출부가 cookie를 이미 넘긴 경우는 덮어쓰지 않는다
  if (!forwardedHeaders.has('cookie')) {
    forwardedHeaders.set('cookie', (await cookies()).toString());
  }

  const previewInit: RequestInit = {
    ...init,
    headers: forwardedHeaders,
    // 보호 리다이렉트를 따라가면 로그인 HTML(200)을 받아 JSON 파싱 에러 → 재시도로 번진다. 3xx는 ApiError로 바로 실패시킨다.
    redirect: 'manual'
  };

  return { url: `${requestHeaders.get('x-forwarded-proto') ?? 'https'}://${host}${input}`, init: previewInit };
}
