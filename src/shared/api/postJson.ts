import { requireAppOrigin } from "@/shared/config";
import { HttpError } from "./HttpError";
import type { ApiErrorResponse } from "./types";

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "message" in value && typeof value.message === "string";
};

// fetchJson과 같은 규칙으로 origin을 맞춘다. 이유는 fetchJson.ts에 적었다.
function resolveUrl(url: string): string {
  if (typeof window !== "undefined" || !url.startsWith("/")) {
    return url;
  }
  return `${requireAppOrigin()}${url}`;
}

// 쓰기 요청은 GET과 두 가지가 다르다.
//   1) 세션 쿠키를 실어야 한다 — same-origin이라 기본값(credentials: "same-origin")으로 충분하지만
//      의도를 코드에 남긴다. 이 값이 "omit"이 되면 로그인이 조용히 안 된다.
//   2) 204(본문 없음)가 정상 응답이다. logout이 그렇다. json()을 부르면 던진다.
export async function postJson<T>(url: string, body?: unknown): Promise<T | null> {
  const response = await fetch(resolveUrl(url), {
    method: "POST",
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const failure: unknown = await response.json().catch(() => null);
    const message = isApiErrorResponse(failure) ? failure.message : "요청을 처리하지 못했습니다.";
    throw new HttpError(response.status, message);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}
