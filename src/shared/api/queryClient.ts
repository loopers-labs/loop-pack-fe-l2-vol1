import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, apiFetchEmpty, SessionExpiredError } from './fetcher';

// [AI] 만료 절차의 "반응" 단계 — 앱 전역에서 단 한 곳 (RFC 세션 만료 처리 위치 결정).
// 절차: 감지(fetcher가 SessionExpiredError로 던짐) → 강제 로그아웃(쿠키 정리) → 정리 → 안내+재진입.
//
// 강제 로그아웃이 필요한 이유: 세션 만료에는 "쿠키가 이미 삭제된 경우"(maxAge 경과)와
// "쿠키가 살아있는데 서버만 만료로 판정한 경우"(시계 차이, 서버 측 무효화, expired 시나리오
// 노브)가 있다. 후자에서 쿠키를 안 지우고 /login으로 보내면 proxy의 존재 확인이 만료 쿠키를
// '로그인 상태'로 오판해 /login을 홈으로 되튕긴다 — 그래서 로그아웃 API로 쿠키를 먼저 지운다.
// 또한 만료 = 강제 로그아웃이므로 의미상으로도 정확하다 (로그아웃 버튼과 같은 서버 절차).
const handleSessionExpired = async () => {
  if (typeof window === 'undefined') return; // 서버 실행(prefetch) 방어
  if (window.location.pathname === '/login') return; // 무한 루프 방어

  // 1) 강제 로그아웃: 서버의 쿠키 삭제 지시(204 + Max-Age=0)로 브라우저 쿠키를 확실히 제거
  try {
    await apiFetchEmpty('/api/auth/logout', { method: 'POST' });
  } catch {
    // 로그아웃 호출 자체가 실패해도(네트워크 등) 진행한다 — 최선 노력(best effort)
  }

  // 2) 정리: 전체 리로드가 모든 클라이언트 상태(캐시 포함)를 초기화한다 — 카트·위시리스트는
  //    localStorage라 리로드와 무관하게 유지된다 (RFC 상태 정리 방침).
  // 3) 안내+재진입: expired 신호로 로그인 화면에 만료 안내를, redirectTo로 복원 경로를 실어 보낸다.
  const params = new URLSearchParams();
  params.set('redirectTo', window.location.pathname + window.location.search);
  params.set('expired', '1');
  window.location.assign(`/login?${params.toString()}`);
};

// 클라이언트 Provider에서 useState 초기값으로 사용할 QueryClient를 만든다. (AI 활용)
export const makeQueryClient = (): QueryClient => {
  return new QueryClient({
    // [AI] query·mutation 어느 쪽에서 만료가 터져도 같은 절차를 탄다 — 커버 누락 방지.
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof SessionExpiredError) handleSessionExpired();
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof SessionExpiredError) handleSessionExpired();
      },
    }),
    defaultOptions: {
      queries: {
        // 기본 staleTime. 각 쿼리 팩토리에서 데이터 성격에 맞게 덮어쓴다.
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        throwOnError: (err) => err instanceof ApiError && err.status >= 500,
      },
    },
  });
};
