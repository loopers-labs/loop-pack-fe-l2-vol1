import { consoleProvider } from './consoleProvider';
import { readCurrentUserId, setUserIdReader } from './currentUser';
import { initAnalytics, registerProviders, setCommonProperties } from './logger';
import { readDevice, readOrCreateSessionId } from './session';

/**
 * 계측 준비. 첫 `track()`보다 먼저 끝나야 한다.
 *
 * `track()`은 불린 시점의 공통 프로퍼티를 이벤트에 합쳐 큐에 넣는다. 준비가 늦으면 그 이벤트는
 * `sessionId` 없이 남고, 나중에 `initAnalytics()`가 큐를 비워도 빠진 값은 되살아나지 않는다.
 * 부르는 자리는 `src/app/analyticsBootstrap.ts`이고, 모듈 평가 시점이라 어떤 렌더보다도 앞선다.
 *
 * 순서: sessionId 준비 → provider 등록 → 공통 프로퍼티 설정 → initAnalytics
 */

let prepared = false;

export type AnalyticsSetupOptions = {
  /**
   * 지금 로그인한 사용자의 id를 돌려준다. 없으면 null.
   *
   * 값을 받아 보관하지 않고 함수를 받는 이유 — 로그인은 이 모듈 밖에서 여러 경로로 바뀐다.
   * 로그인 성공, 이미 로그인된 채로 새로고침, 세션 만료, 로그아웃이 모두 세션 상태를 바꾸는데,
   * 그때마다 여기에 알려주는 구조면 알려주지 않는 경로가 하나만 생겨도 로그가 조용히 어긋난다.
   * 이벤트가 발생하는 시점에 세션 상태를 직접 읽으면 그 경로를 빠뜨릴 수 없다.
   */
  readUserId: () => string | null;
};

export function setupAnalytics({ readUserId }: AnalyticsSetupOptions): void {
  if (prepared || typeof window === 'undefined') {
    return;
  }
  prepared = true;

  setUserIdReader(readUserId);

  const sessionId = readOrCreateSessionId();

  registerProviders([consoleProvider]);

  // 함수로 넘겨 이벤트가 발생하는 시점에 평가되게 한다. `ts`는 이벤트마다 달라야 하고,
  // `device`는 창 크기가 바뀌면, `userId`는 로그인 상태가 바뀌면 따라 바뀌어야 한다.
  setCommonProperties(() => {
    const userId = readCurrentUserId();
    return {
      sessionId,
      ts: new Date().toISOString(),
      device: readDevice(),
      ...(userId === null ? {} : { userId }),
    };
  });

  void initAnalytics();
}

/** 테스트에서 준비 상태를 되돌린다 */
export function resetAnalyticsSetupForTest(): void {
  prepared = false;
}
