import { identify, reset } from './logger';

/**
 * 이벤트에 실을 사용자와, 프로바이더가 알고 있는 사용자를 맞춘다.
 *
 * 두 값은 출처가 다르다. 이벤트의 `userId`는 발생 시점에 세션 상태를 읽어 붙이고,
 * 프로바이더의 사용자는 `identify()`·`reset()`을 불러야 바뀐다. 호출을 화면 코드에 흩어 두면
 * 로그인 성공에만 붙고 새로고침·만료에는 빠지는 식으로 두 값이 갈린다.
 *
 * 그래서 이벤트를 보내기 직전에 한 번 맞춘다. 달라졌을 때만 부르므로 같은 사용자에게
 * `identify()`가 반복되지 않는다.
 */

/** 세션 상태를 읽는 방법. 앱 계층이 주입한다 */
let readUserId: () => string | null = () => null;

/** 프로바이더에 마지막으로 알린 사용자 */
let notifiedUserId: string | null = null;

export function setUserIdReader(read: () => string | null): void {
  readUserId = read;
}

/** 지금 로그인한 사용자. 없으면 null */
export function readCurrentUserId(): string | null {
  return readUserId();
}

/** 프로바이더가 아는 사용자를 현재 세션에 맞춘다. 이벤트를 보내기 직전에 부른다 */
export function syncAnalyticsUser(): void {
  const userId = readCurrentUserId();
  if (userId === notifiedUserId) {
    return;
  }

  if (userId === null) {
    reset();
  } else {
    identify(userId);
  }
  // 알린 뒤에 기록한다. 지금은 로거가 프로바이더 예외를 자체적으로 삼켜서 실패가 여기까지
  // 오지 않지만, 대입을 앞에 두면 "성공했다"는 가정이 코드에 박힌다.
  // 실패를 알리는 로거로 바뀌면 이 순서라야 다음 이벤트에서 다시 시도한다 — 잔여 위험은 A-7에 있다
  notifiedUserId = userId;
}

/** 테스트에서 모듈 상태를 되돌린다 */
export function resetCurrentUserForTest(): void {
  readUserId = () => null;
  notifiedUserId = null;
}
