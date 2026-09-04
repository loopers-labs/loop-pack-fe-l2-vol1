import { queryOptions } from "@tanstack/react-query";
import { HttpError, fetchJson, isServerFault } from "@/shared/api";
import type { SessionResponse, SessionState } from "../model/types";

// 세션은 요청마다 값이 달라지는 서버 상태다. 5주차부터 써온 zustand 패턴을 쓰지 않는다 —
// store에 담으면 "서버가 아는 값"과 "브라우저가 기억하는 값"이 갈라지고, 만료를
// 브라우저가 알 방법이 없다. 서버가 소유하고 화면은 조회한다.
export const SESSION_QUERY_KEY = ["session"];

export const ANONYMOUS: SessionState = { status: "anonymous" };

// /api/auth/me는 "로그인 안 함"과 "세션 만료"를 같은 401로 돌려준다.
// 이 조회는 둘을 가르지 않고 anonymous로 접는다. 만료는 응답 하나로 알 수 없고
// "인정받던 세션이 거절됐다"는 전이로만 알 수 있어서, 그 판단은 sessionExpiry.ts에 있다.
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<SessionState> => {
      try {
        const session = await fetchJson<SessionResponse>("/api/auth/me");
        return { status: "authenticated", user: session.user };
      } catch (error) {
        if (error instanceof HttpError && error.status === 401) {
          return ANONYMOUS;
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
