import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { isUnauthorizedError } from '@/shared/api/response';
import { buildLoginPath } from '@/shared/lib/safeRedirectPath';

/**
 * 세션 만료를 처리하는 단 한 곳.
 *
 * 화면마다 401을 다루면 나중에 어디를 고쳐야 할지 알 수 없어진다. 모든 클라이언트 조회가
 * `apiResponseResult`를 지나고 그 함수가 상태 코드를 담은 ApiError를 던지므로, 캐시 단위의
 * onError 두 개로 전부 받을 수 있다.
 *
 * 만료로 볼 요청 범위는 좁힌다 —
 * - 조회(QueryCache): 보호 경로 데이터. 세션 조회는 401을 null로 바꿔 돌려주므로 여기로 오지 않는다
 * - 변경(MutationCache): `meta.authRequired`를 붙인 것만. 로그인 요청의 401은 자격 불일치라 제외한다
 *
 * 만료인지 미로그인인지는 직전 캐시 값으로 가른다. 로그인 상태였는데 401이 왔다면 그 세션이
 * 더는 유효하지 않은 것이고, 처음부터 null이었다면 그냥 로그인하지 않은 상태다.
 */

/** 로그인 화면으로 보내는 방법. App Router의 replace를 주입받는다 */
type RedirectToLogin = (path: string) => void;

/**
 * 주입 전에 쓰는 기본값.
 *
 * 401은 사용자 조작 뒤에만 오므로 그 시점엔 주입이 끝나 있다. 그래도 기본값을 두는 건,
 * 어떤 이유로 주입이 늦어도 보호 화면에 머무르는 것보다 전체 이동이라도 하는 편이 낫기 때문이다.
 */
const reloadToLogin: RedirectToLogin = (path) => {
  window.location.assign(path);
};

let redirectToLogin: RedirectToLogin = reloadToLogin;

/** App Router의 replace로 바꿔 끼운다. MainProvider가 마운트된 뒤에 부른다 */
export function setLoginRedirect(redirect: RedirectToLogin): void {
  redirectToLogin = redirect;
}

/**
 * 401 처리기를 붙인 QueryClient를 만든다.
 *
 * 콜백이 자기가 속한 client를 참조해야 해서 지역 변수에 담아 넘긴다. 콜백은 요청이 실패한
 * 뒤에만 도므로 그 시점엔 할당이 끝나 있다.
 *
 * @param redirect 이동 방법을 직접 지정한다. 비우면 `setLoginRedirect`로 주입된 것을 쓴다
 */
export function createQueryClient(redirect?: RedirectToLogin): QueryClient {
  const handleUnauthorized = () => {
    const hadSession = client.getQueryData(SESSION_QUERY_KEY) != null;
    client.setQueryData(SESSION_QUERY_KEY, null);

    // 훅 대신 location을 읽는다 — 이 콜백은 사용자 조작 뒤에만 도는 클라이언트 코드라
    // useSearchParams를 쓰면 정적 프리렌더에 Suspense 경계만 더 요구하게 된다
    const currentPath = `${window.location.pathname}${window.location.search}`;
    (redirect ?? redirectToLogin)(buildLoginPath(currentPath, hadSession));
  };

  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isUnauthorizedError(error) && query.meta?.authRequired === true) {
          handleUnauthorized();
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (isUnauthorizedError(error) && mutation.meta?.authRequired === true) {
          handleUnauthorized();
        }
      },
    }),
  });

  return client;
}

let browserClient: QueryClient | null = null;

/**
 * 브라우저에서 쓰는 QueryClient. 탭 하나에 하나다.
 *
 * 서버가 dehydrate에 쓰는 `shared/api/getQueryClient`와는 다른 것이다. 그쪽은 요청마다 새로
 * 만들어 데이터를 실어 보내는 용도이고, 이쪽은 401 처리기를 달고 탭 전체가 함께 쓰는 캐시다.
 *
 * 렌더 밖에서도 같은 캐시를 읽어야 해서 싱글턴으로 둔다. 계측의 공통 프로퍼티가 이벤트마다
 * 세션 캐시를 읽는데, 그 코드는 React 훅을 쓸 수 없는 자리에 있다. 렌더가 버려져도 인스턴스는
 * 하나뿐이라 버려진 렌더의 캐시를 붙들고 있을 여지도 없다.
 *
 * 서버에서는 요청마다 새로 만든다. 요청 사이에 캐시가 섞이면 다른 사용자의 데이터가 보인다.
 */
export function getBrowserQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  browserClient ??= createQueryClient();
  return browserClient;
}
