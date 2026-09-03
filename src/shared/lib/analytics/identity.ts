import { identify, reset } from '@/analytics/logger';

import { clearAnalyticsUser, setAnalyticsUser } from './commonProperties';

/**
 * 분석 도구의 사용자 식별과 공통 프로퍼티의 userId 는 항상 함께 움직인다.
 *
 * 따로 부르면 한쪽만 빠뜨릴 수 있고, 그 결과가 조용하다 — 로그아웃한 뒤에도 다음 사람의
 * 이벤트에 앞사람의 userId 가 계속 붙는데 화면에는 아무 일도 일어나지 않는다.
 * 두 호출을 한 이름 뒤에 두어 빠뜨릴 자리를 없앤다.
 */
export function identifyUser(userId: string): void {
  identify(userId);
  setAnalyticsUser(userId);
}

export function forgetUser(): void {
  reset();
  clearAnalyticsUser();
}
