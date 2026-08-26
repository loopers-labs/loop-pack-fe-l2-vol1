import { queryOptions } from "@tanstack/react-query";
import { getBaseUrl, requestJson } from "@/shared/api";
import type { SessionResponse } from "../model/types";

const SESSION_STALE_TIME = 60 * 1000;

function getSession(): Promise<SessionResponse> {
  return requestJson<SessionResponse>(`${getBaseUrl()}/api/auth/me`);
}

export const sessionQueries = {
  all: () => ["session"] as const,
  me: () =>
    queryOptions({
      queryKey: [...sessionQueries.all(), "me"] as const,
      queryFn: getSession,
      staleTime: SESSION_STALE_TIME,
      // 401(미로그인)은 재시도할 값이 아니고, 에러 경계로 보내지 않는다.
      retry: false,
      throwOnError: false,
      // 세션 만료(성공 후 401)의 리다이렉트는 별도 층(queryClient onError)이 meta.authGuarded 로 가른다.
      meta: { authGuarded: true },
    }),
};
