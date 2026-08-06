import { ApiError } from "@/shared/api/apiError";
import type { ApiErrorResponse } from "@/shared/api/types";
import { APP_ORIGIN } from "@/shared/config/appOrigin";

// 브라우저는 상대경로로 fetch할 수 있지만, 서버 프리패치는 절대 URL이 필요하다.
// 서버 self-fetch base는 metadataBase와 같은 APP_ORIGIN을 써서 origin을 하나로 맞춘다.
function resolveUrl(path: string): string {
  if (typeof window !== "undefined") {
    return path;
  }
  return `${APP_ORIGIN}${path}`;
}

// 클라이언트 조회 계층. 실패를 ApiError(kind·status)로 바꿔 TanStack Query로 흘려보낸다.
// 전역 throwOnError 정책이 kind·status를 보고 5xx는 경계로, 4xx·네트워크는 인라인으로 가른다.
// no-store는 서버 프리패치가 자기 API를 부를 때 이 라우트를 매 요청 렌더로 만들어,
// 빌드 타임에 빈 데이터가 구워지는 것을 막는다. 클라이언트 캐싱은 React Query가 맡는다.
export async function fetchJson<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(resolveUrl(path), { cache: "no-store", signal: options?.signal });
  } catch (error) {
    // 취소(AbortError)는 그대로 던져 TanStack이 네트워크 실패가 아니라 취소로 인식하게 한다.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    // 그 외 fetch 거부는 네트워크 실패(오프라인 등)다. HTTP status가 없다.
    throw new ApiError("network", null, "네트워크 연결을 확인해 주세요.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiError("http", response.status, body?.message ?? "요청을 처리하지 못했습니다.");
  }

  return response.json() as Promise<T>;
}
