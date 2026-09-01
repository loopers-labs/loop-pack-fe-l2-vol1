import { apiClient } from '@/shared/api/apiClient';
import { queryOptions } from '@tanstack/react-query';

import type { MyPageResponse } from '../model/types';

const fetchMe = () => apiClient.get<MyPageResponse>('/auth/me');

/**
 * 마이페이지 쿼리 팩토리. 브라우저에서만 쓴다.
 *
 * 홈과 달리 서버 prefetch 와 공용이 아니다. 보호 API 라 서버 분기의 fetch 가
 * 세션 쿠키를 싣지 못해 401 을 받는다 — 근거는 app/(shop)/mypage/page.tsx 주석에 있다.
 *
 * staleTime 을 두지 않는다(기본 0). 이 쿼리는 프로필을 보여주는 동시에
 * **세션이 아직 살아 있는지 묻는 통로**다. fresh 로 붙들면 만료된 세션으로도
 * 캐시된 이름이 계속 보여서, 만료를 알아채는 시점이 뒤로 밀린다.
 */
export const mypageQueryOptions = {
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'] as const,
      queryFn: fetchMe,
    }),
};
