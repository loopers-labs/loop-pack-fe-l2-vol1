'use client';

import { setupAnalytics } from '@/analytics/setup';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { getBrowserQueryClient } from './queryClient';
import type { AuthUser } from '@/entities/session/model/session';

/**
 * 계측 준비를 모듈 로드 시점에 끝낸다.
 *
 * `track()`은 불린 시점의 공통 프로퍼티를 이벤트에 합쳐 큐에 넣는다. 준비가 늦으면 그 이벤트는
 * `sessionId` 없이 남고 나중에 되살릴 수 없다. 화면 진입 이벤트는 자식 컴포넌트의 effect에서
 * 나가는데 자식의 effect는 부모보다 먼저 돌기 때문에, 부모 컴포넌트 안에 두면 어느 자리든 늦다.
 * 모듈 평가는 첫 렌더보다 앞서므로 순서를 따로 맞출 필요가 없다.
 *
 * 세션을 읽는 자리를 여기에 둔 것은 계층 때문이다. 계측 모듈은 어떤 화면이 세션을 어디에
 * 보관하는지 알지 않고, 그 연결은 앱 계층인 이 파일이 맡는다.
 */
setupAnalytics({
  // 이벤트마다 세션 캐시를 읽는다. 로그인 성공·새로고침·만료·로그아웃이 모두 이 캐시를 바꾸므로,
  // 어느 경로로 상태가 바뀌든 다음 이벤트부터 바로 반영된다
  readUserId: () =>
    getBrowserQueryClient().getQueryData<AuthUser | null>(SESSION_QUERY_KEY)?.id ?? null,
});
