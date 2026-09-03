export type Device = 'mobile' | 'tablet' | 'desktop';

const TABLET_MIN_WIDTH = 768;
const DESKTOP_MIN_WIDTH = 1024;

/**
 * 화면 폭으로 기기 종류를 정한다.
 *
 * User-Agent 를 파싱하지 않는다. 파싱 규칙을 직접 유지해야 하고, 개발자 도구의 기기
 * 에뮬레이션에서 실제와 다른 값이 찍혀 계측을 확인하기 어려워진다.
 * 폭 기준은 "지금 어떤 레이아웃을 보고 있는가"를 그대로 말해준다.
 *
 * 폭을 인자로 받는다. window 를 직접 읽으면 이 판정을 검증하려고 전역을 갈아끼워야 한다.
 */
export function toDevice(viewportWidth: number): Device {
  if (viewportWidth < TABLET_MIN_WIDTH) {
    return 'mobile';
  }

  if (viewportWidth < DESKTOP_MIN_WIDTH) {
    return 'tablet';
  }

  return 'desktop';
}
