import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import { isProtectedPath } from '@/shared/config/protected-routes';
import { LOGIN_MUTATION_KEY } from '@/entities/session/api/sessionQueries';

const HTTP_UNAUTHORIZED = 401;

function isLoginMutation(mutationKey: readonly unknown[] | undefined): boolean {
  if (!mutationKey) return false;
  return (
    mutationKey.length === LOGIN_MUTATION_KEY.length &&
    mutationKey.every((value, index) => value === LOGIN_MUTATION_KEY[index])
  );
}

function redirectToExpiredLogin() {
  const { pathname, search, origin } = window.location;
  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('redirect', pathname + search);
  loginUrl.searchParams.set('reason', 'expired');
  window.location.href = loginUrl.toString();
}

// "로그인 안 함"과 "세션 만료"를 구분하는 기준: 보호 경로에서 받은 401만
// 만료로 간주한다. proxy가 쿠키 없는 요청은 이미 걸러냈으므로, 그 이후
// 보호 경로에서 나는 401은 "쿠키는 있었지만 무효화됨"으로 해석할 수 있다.
// 로그인 mutation 자체의 401(자격 증명 틀림)은 이 흐름에서 제외한다 —
// 로그인 시도 자체가 아직 안 된 상태라 "만료" 개념이 성립하지 않는다.
function handlePossibleSessionExpiry(
  error: unknown,
  mutationKey?: readonly unknown[],
) {
  if (typeof window === 'undefined') return;
  if (!(error instanceof ApiError) || error.status !== HTTP_UNAUTHORIZED)
    return;
  if (isLoginMutation(mutationKey)) return;
  if (!isProtectedPath(window.location.pathname)) return;

  redirectToExpiredLogin();
}

export function createSessionAwareQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => handlePossibleSessionExpiry(error),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        handlePossibleSessionExpiry(error, mutation.options.mutationKey);
      },
    }),
  });
}
