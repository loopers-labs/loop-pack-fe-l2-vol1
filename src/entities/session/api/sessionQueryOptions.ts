import { queryOptions } from '@tanstack/react-query';
import { apiResponseResult, isUnauthorizedError } from '@/shared/api/response';
import { SESSION_STALE_TIME_MS } from '@/shared/config/session';
import type { AuthUser, SessionResponse } from '@/entities/session/model/session';

/** 서버가 읽은 세션을 초기값으로 심을 때도 이 키를 쓴다 */
export const SESSION_QUERY_KEY = ['session'] as const;

/**
 * 로그인한 사용자. 로그인하지 않았거나 세션이 더는 유효하지 않으면 null.
 *
 * 401을 에러로 던지지 않고 null로 돌려주는 이유 — `/api/auth/me`의 401은 "조회 실패"가
 * 아니라 "로그인하지 않은 상태"라는 정상 응답이다. 에러로 두면 화면마다 에러 UI가 뜬다.
 * 그 401이 만료인지 미로그인인지는 이 함수가 가릴 수 없다(httpOnly 쿠키를 읽을 수 없다).
 * 만료 판정은 세션 쿠키의 유무를 아는 쪽에서 한다 — 서버는 readServerSession이,
 * 클라이언트는 직전 상태를 아는 전역 401 처리기가 맡는다.
 *
 * 만료를 알려주는 계기가 보호 경로 요청의 401뿐이면, 그 요청은 보호 화면에서만 나가므로
 * 홈이나 목록에 머무는 동안에는 화면이 로그인 상태로 남는다. staleTime을 짧게 두고
 * 포커스 복귀에 재조회를 걸어 그 창을 좁힌다.
 *
 * 정정되는 범위는 두 경우다 — 다른 탭·앱에 갔다가 돌아왔을 때, 그리고 이 쿼리가 다시
 * 구독될 때. **같은 화면을 계속 보고 있는 동안에는 정정되지 않는다.** staleTime은 다시
 * 물어봐도 되는 시점만 정하고 스스로 요청하지는 않기 때문이다. 그 이상은 폴링이 필요한데
 * 비용에 비해 얻는 것이 적어 이번 범위에 넣지 않았다.
 *
 * 첫 진입에는 서버가 심은 값이 방금 만들어진 것이라 요청이 나가지 않는다. 이 라우트의
 * 500ms 지연을 홈 cold load의 waterfall에 얹지 않으려던 원래 근거는 그대로다.
 */
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        const { user } = (await apiResponseResult('/api/auth/me')) as SessionResponse;
        return user;
      } catch (error) {
        if (isUnauthorizedError(error)) {
          return null;
        }
        throw error;
      }
    },
    staleTime: SESSION_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });
}
