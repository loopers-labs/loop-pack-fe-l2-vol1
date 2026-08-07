import { HttpError } from "./HttpError";
import type { ApiErrorResponse } from "./types";

// API 에러 응답 좁히기 — as 없이 타입 가드로 message를 확보.
const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "message" in value && typeof value.message === "string";
};

// 브라우저에서는 상대 경로가 그대로 동작하지만, 서버(RSC·generateMetadata)에는
// 기준 origin이 없다. 같은 query factory를 양쪽에서 쓰려면 여기서 한 번만 맞춘다.
// APP_ORIGIN은 build와 runtime에 같은 값을 넣는다(닿지 않는 origin을 넣으면 실패를 재현할 수 있다).
function resolveUrl(url: string): string {
  if (typeof window !== "undefined" || !url.startsWith("/")) {
    return url;
  }
  const origin = process.env.APP_ORIGIN ?? `http://localhost:${process.env.PORT ?? "3000"}`;
  return `${origin}${url}`;
}

// signal은 선택이다 — 넘기면 더는 필요 없어진 요청을 브라우저가 실제로 끊는다.
// 취소된 요청은 TanStack Query가 에러로 올리지 않으므로 화면이 실패로 보이지 않는다.
//
// 서버에서는 붙이지 않는다. 같은 render/request 안의 native fetch는 URL과 options가
// "모두" 같을 때만 memoize되는데, TanStack이 호출마다 다른 signal을 주기 때문에
// generateMetadata와 본문이 각각 Route Handler를 때린다(계측으로 2회 확인).
// 서버는 한 번에 끝나는 경로라 취소할 대상도 없다.
export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  const response = await fetch(resolveUrl(url), isBrowser ? { signal } : undefined);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    // 화면 문구는 각 화면이 소유한다. 여기서는 서버가 준 message와 status만 전달한다.
    const message = isApiErrorResponse(body) ? body.message : "요청을 처리하지 못했습니다.";
    throw new HttpError(response.status, message);
  }
  return response.json();
}
