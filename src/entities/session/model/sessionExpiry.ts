import type { QueryClient } from "@tanstack/react-query";
import { HttpError } from "@/shared/api";
import { SESSION_QUERY_KEY } from "../api/sessionQuery";
import { rejectSession } from "./resolveSession";
import type { SessionState } from "./types";

// ── 세션 만료를 처리하는 단 하나의 자리 ─────────────────────────────────────
//
// 화면마다 401을 잡으면 다음에 어디를 고칠지 알 수 없다. 그래서 QueryCache의
// onError 한 곳에서만 판단하고, 화면은 그 결과(SessionState)만 읽는다.
//
// **어떤 401을 만료로 볼 것인가.** /api/auth/me의 401은 만료가 아니다 —
// 로그인한 적 없는 사람도 똑같이 받는다. 만료로 보는 것은 **보호된 리소스**의
// 401이고, 그중에서도 **직전까지 authenticated였을 때**만이다. 인정받던 세션이
// 거절됐다는 전이가 만료의 정의다. 응답 하나만 봐서는 알 수 없다.

// QueryCache의 onError가 넘겨주는 Query는 error 타입 파라미터가 unknown이라
// 기본 Query 타입과 어긋난다. 여기서 필요한 것은 키뿐이므로 그것만 요구한다.
type QueryKeyOwner = { readonly queryKey: readonly unknown[] };

const isSessionQuery = (query: QueryKeyOwner) => query.queryKey[0] === SESSION_QUERY_KEY[0];

export function handleQueryError(
  error: unknown,
  query: QueryKeyOwner,
  queryClient: QueryClient,
): void {
  if (!(error instanceof HttpError) || error.status !== 401) {
    return;
  }
  if (isSessionQuery(query)) {
    return;
  }

  // 판정은 resolveSession이 한다. 여기서 하는 일은 "어떤 401을 세션 판정에
  // 넘길지" 고르는 것뿐이다 — /api/auth/me의 401은 이 경로로 오지 않는다
  // (그건 조회 자신이 직접 처리한다).
  const previous = queryClient.getQueryData<SessionState>(SESSION_QUERY_KEY);
  queryClient.setQueryData(SESSION_QUERY_KEY, rejectSession(previous));
}
