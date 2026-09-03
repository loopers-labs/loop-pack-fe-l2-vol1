import type { EventProperties } from '@/analytics/provider';

import { toDevice } from './device';
import { getSessionId } from './sessionId';

/**
 * 로그인한 사용자. 로그인 성공 시 채워지고 로그아웃 시 비워진다.
 *
 * 시드 로그는 userId 를 이벤트의 top-level 필드로 갖고 "로그인한 뒤의 이벤트에만" 붙인다.
 * 우리 logger 의 track() 은 이름과 프로퍼티만 받으므로 공통 프로퍼티로 얹어 같은 성질을 낸다 —
 * 로그인 전에는 키 자체가 없고, 로그인 후 모든 이벤트에 붙는다.
 */
let currentUserId: string | null = null;

export function setAnalyticsUser(userId: string): void {
  currentUserId = userId;
}

export function clearAnalyticsUser(): void {
  currentUserId = null;
}

/**
 * 모든 이벤트에 붙는 값.
 *
 * setCommonProperties 에 이 함수를 그대로 넘긴다. logger 가 **이벤트 발생 시점에** 부르므로
 * ts 는 전송 시각이 아니라 행위가 일어난 시각이고, userId 는 그 시점의 로그인 상태를 반영한다.
 */
export function getCommonProperties(): EventProperties {
  return {
    sessionId: getSessionId(),
    device: toDevice(window.innerWidth),
    ts: new Date().toISOString(),
    ...(currentUserId === null ? {} : { userId: currentUserId }),
  };
}
