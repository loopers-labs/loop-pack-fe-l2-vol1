// 쿠키 이름과 TTL만 담는다. Edge 런타임에서 도는 코드(proxy · middleware)가
// 이 값들을 가져갈 수 있어야 하므로, node:crypto 를 쓰는 auth.ts 와 파일을 나눠 둔다.
// 한 파일에 두면 상수 하나만 import 해도 crypto 가 Edge 번들에 함께 끌려 들어가고,
// next build 는 경고만 내고 통과하지만 실제 실행에서 500 이 난다.

export const SESSION_COOKIE = 'session';
export const SCENARIO_COOKIE = 'scenario';
export const SESSION_TTL_SECONDS = 60 * 60;

// scenario=expired 시뮬레이션 판정을 한 곳에 모은다. 예전엔 CommerceLayout이
// 쿠키를(scenario === 'expired') 직접 비교하고, login/page.tsx는 그와 별개로
// URL의 reason 파라미터(reason !== 'expired')를 봐서 같은 "만료 상황"을 두
// 벌의 서로 다른 신호로 판정했다 — 한쪽만 바뀌면 다른 쪽이 조용히 어긋날 수
// 있었다. 지금은 둘 다 이 함수로 같은 쿠키를 본다. (reason 쿼리 파라미터는
// 여전히 남아있지만 로그인 화면에 "만료됐다"는 문구를 보여줄지에만 쓴다 —
// 실제 세션 TTL 만료(시뮬레이션 쿠키가 없는 경우)에도 reason=expired로
// 도착하므로 그 문구 표시까지 이 함수로 옮기면 안 된다.)
export function isExpiredScenario(
  scenarioCookieValue: string | undefined,
): boolean {
  return scenarioCookieValue === 'expired';
}
