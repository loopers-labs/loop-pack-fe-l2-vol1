// 세션 만료 판정과 신호를 나눠 둔다:
// - 판정(isSessionExpiry)은 부작용 없는 순수 함수라 단독 테스트가 쉽다.
// - 신호(onSessionExpired/notifySessionExpired)는 라이브러리 무관한 순수 TS 이벤트 버스다.
// queryClient 어댑터는 "만료다"만 판정·발신하고, /login 리다이렉트 같은 라우팅 부작용은
// React 층(리스너)이 갖는다 — 그래야 shared 가 next/navigation 에 의존하지 않는다.

// 세션이 있었는데(=이전에 성공한 적 있는 인증 쿼리) 401 을 받으면 만료로 본다.
// 미로그인(처음부터 401, data 없음)은 만료가 아니다.
const UNAUTHORIZED = 401;

export function isSessionExpiry(input: {
  status: number | undefined;
  isAuthGuarded: boolean;
  hadData: boolean;
}): boolean {
  return input.status === UNAUTHORIZED && input.isAuthGuarded && input.hadData;
}

type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifySessionExpired(): void {
  for (const listener of listeners) {
    listener();
  }
}
