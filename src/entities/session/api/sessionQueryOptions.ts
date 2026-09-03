import { queryOptions } from '@tanstack/react-query';
import { apiResponseResult, isUnauthorizedError } from '@/shared/api/response';
import { SESSION_TTL_SECONDS } from '@/shared/config/session';
import type { AuthUser, SessionResponse } from '@/entities/session/model/session';

/** 서버가 읽은 세션을 초기값으로 심을 때도 이 키를 쓴다 */
export const SESSION_QUERY_KEY = ['session'] as const;

const MS_PER_SECOND = 1000;

/**
 * 로그인한 사용자. 로그인하지 않았거나 세션이 더는 유효하지 않으면 null.
 *
 * 401을 에러로 던지지 않고 null로 돌려주는 이유 — `/api/auth/me`의 401은 "조회 실패"가
 * 아니라 "로그인하지 않은 상태"라는 정상 응답이다. 에러로 두면 화면마다 에러 UI가 뜬다.
 * 그 401이 만료인지 미로그인인지는 이 함수가 가릴 수 없다(httpOnly 쿠키를 읽을 수 없다).
 * 만료 판정은 세션 쿠키의 유무를 아는 쪽에서 한다 — 서버는 readServerSession이,
 * 클라이언트는 직전 상태를 아는 전역 401 처리기가 맡는다.
 *
 * staleTime을 세션 수명으로 잡아 마운트 직후의 background refetch를 막는다. 이 라우트에는
 * 500ms 지연이 걸려 있어서, 그대로 두면 홈 cold load의 waterfall에 지연 요청이 하나 더 얹힌다.
 * 만료는 시간이 아니라 보호 경로 요청의 401로 알게 되고, 그때 이 쿼리를 무효화한다.
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
    staleTime: SESSION_TTL_SECONDS * MS_PER_SECOND,
  });
}
