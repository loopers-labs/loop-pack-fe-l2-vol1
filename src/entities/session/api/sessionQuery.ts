import { queryOptions } from "@tanstack/react-query";
import { HttpError, fetchJson, isServerFault } from "@/shared/api";
import { acceptSession, rejectSession } from "../model/resolveSession";
import type { SessionResponse, SessionState } from "../model/types";

// 세션은 요청마다 값이 달라지는 서버 상태다. 5주차부터 써온 zustand 패턴을 쓰지 않는다 —
// store에 담으면 "서버가 아는 값"과 "브라우저가 기억하는 값"이 갈라지고, 만료를
// 브라우저가 알 방법이 없다. 서버가 소유하고 화면은 조회한다.
export const SESSION_QUERY_KEY = ["session"];

// /api/auth/me는 "로그인 안 함"과 "세션 만료"를 같은 401로 돌려준다.
// 그래서 응답만 보고는 가를 수 없고, **직전 상태**와 함께 봐야 한다.
// 그 규칙은 resolveSession.ts 한 곳에 있다 — 여기서 다시 판단하지 않는다.
//
// 이 조회가 직전 상태를 읽는 것이 중요하다. 예전에는 401을 무조건 anonymous로
// 접었는데, 그러면 서버가 심어 준 expired가 60초 뒤 첫 재조회에서 지워졌다.
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async ({ client }): Promise<SessionState> => {
      const previous = client.getQueryData<SessionState>(SESSION_QUERY_KEY);
      try {
        const session = await fetchJson<SessionResponse>("/api/auth/me");
        return acceptSession(session.user);
      } catch (error) {
        if (error instanceof HttpError && error.status === 401) {
          return rejectSession(previous);
        }
        throw error;
      }
    },
    // 만료가 1시간이라 그보다 훨씬 짧게 둔다. 화면 전환마다 다시 묻지는 않는다.
    staleTime: 60 * 1000,
    // 401은 위에서 접었으므로 여기 올라오는 4xx는 없다. 5xx만 경계로.
    throwOnError: (error) => isServerFault(error),
  });
}
