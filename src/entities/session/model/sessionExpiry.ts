import type { QueryClient } from "@tanstack/react-query";
import { HttpError } from "@/shared/api";
import { SESSION_QUERY_KEY } from "../api/sessionQuery";
import { rejectSession } from "./resolveSession";
import type { SessionState } from "./types";

// ── 세션 만료를 처리하는 단 하나의 자리 ─────────────────────────────────────
//
// 화면마다 401을 잡으면 다음에 어디를 고칠지 알 수 없다. 그래서 캐시의 onError
// 한 곳에서만 판단하고, 화면은 그 결과(SessionState)만 읽는다.
//
// **조회와 변경 둘 다 받아야 한다.** 처음엔 QueryCache에만 붙였는데, 그건 query만
// 받는다. 주문 전송은 mutation이라 여기 오지 않았고, 그래서 주문서에서 만료된
// 사용자가 주문하기를 눌러 401을 받아도 세션은 authenticated로 남았다
// (실측: `expected 'authenticated' to be 'expired'`). MutationCache에도 붙인다.
//
// **어떤 401을 만료로 볼 것인가.** /api/auth/me의 401은 만료가 아니다 —
// 로그인한 적 없는 사람도 똑같이 받는다. 만료로 보는 것은 **보호된 리소스**의
// 401이고, 그중에서도 **직전까지 authenticated였을 때**만이다. 인정받던 세션이
// 거절됐다는 전이가 만료의 정의다. 응답 하나만 봐서는 알 수 없다.

// QueryCache의 onError가 넘겨주는 Query는 error 타입 파라미터가 unknown이라
// 기본 Query 타입과 어긋난다. 여기서 필요한 것은 키뿐이므로 그것만 요구한다.
type QueryKeyOwner = { readonly queryKey: readonly unknown[] };

const isSessionQuery = (query: QueryKeyOwner) => query.queryKey[0] === SESSION_QUERY_KEY[0];

// 인증 자체를 다루는 변경은 세션 판정에서 뺀다.
// 로그인 실패의 401은 "자격 증명이 틀렸다"는 뜻이지 "세션이 만료됐다"가 아니다.
// 로그인한 사람이 비밀번호를 틀리게 다시 입력하는 경로가 실제로 있고, 그때
// 멀쩡한 세션이 만료로 바뀌면 안 된다.
export const AUTH_MUTATION_KEY = ["auth"];

const isAuthMutation = (mutation: { options: { mutationKey?: readonly unknown[] } }) =>
  mutation.options.mutationKey?.[0] === AUTH_MUTATION_KEY[0];

const isUnauthorized = (error: unknown) => error instanceof HttpError && error.status === 401;

function rejectInto(queryClient: QueryClient): void {
  const previous = queryClient.getQueryData<SessionState>(SESSION_QUERY_KEY);
  queryClient.setQueryData(SESSION_QUERY_KEY, rejectSession(previous));
}

/**
 * 변경 요청의 401. 기본값이 "세션이 거절됐다"인 것이 의도다 —
 * 보호된 자원에 쓰기를 시도했는데 401이면 세션 문제로 보는 것이 맞고,
 * 예외인 인증 변경만 위에서 뺀다. 새 mutation이 생겨도 기본이 안전한 쪽이다.
 */
export function handleMutationError(
  error: unknown,
  mutation: { options: { mutationKey?: readonly unknown[] } },
  queryClient: QueryClient,
): void {
  if (!isUnauthorized(error) || isAuthMutation(mutation)) {
    return;
  }
  rejectInto(queryClient);
}

/**
 * 조회의 401. 판정은 resolveSession이 한다 — 여기서 하는 일은 "어떤 401을 세션
 * 판정에 넘길지" 고르는 것뿐이다. /api/auth/me의 401은 이 경로로 오지 않는다
 * (그건 조회 자신이 직접 처리한다).
 */
export function handleQueryError(
  error: unknown,
  query: QueryKeyOwner,
  queryClient: QueryClient,
): void {
  if (!isUnauthorized(error) || isSessionQuery(query)) {
    return;
  }
  rejectInto(queryClient);
}
