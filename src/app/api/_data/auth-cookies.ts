// 쿠키 이름과 TTL만 담는다. Edge 런타임에서 도는 코드(proxy · middleware)가
// 이 값들을 가져갈 수 있어야 하므로, node:crypto 를 쓰는 auth.ts 와 파일을 나눠 둔다.
// 한 파일에 두면 상수 하나만 import 해도 crypto 가 Edge 번들에 함께 끌려 들어가고,
// next build 는 경고만 내고 통과하지만 실제 실행에서 500 이 난다.

export const SESSION_COOKIE = "session";
export const SCENARIO_COOKIE = "scenario";
export const SESSION_TTL_SECONDS = 60 * 60;
