import { identify, reset, track } from "@/analytics/logger";
import type { EventName, EventProps } from "./events";

// ── 한 겹 두는 이유 ─────────────────────────────────────────────────────────
// 화면이 `track()`을 직접 부르지 않게 한다. 스타터의 `track`은
// `(string, Record<string, unknown>)`을 받아서 이름을 잘못 써도, 프로퍼티 키를
// 빠뜨려도 타입이 통과한다. 그런데 3단계에서 이 로그로 경로를 세기 때문에
// 이름·키가 어긋나는 순간 집계가 조용히 틀린다.
//
// 그래서 경계를 하나 둔다. 여기를 지나가야 하고, 여기는 스키마(events.ts)를 안다.
// 화면은 `trackEvent(EVENT.cartAdd, { productId, quantity })`만 쓴다 — 어느
// 분석 도구를 쓰는지, 초기화가 끝났는지는 모른다.
//
// 이게 6주차 FSD 경계와도 맞는다. `shared/analytics`가 `@/analytics`(스타터
// 로거)를 감싸고, 위 레이어는 shared만 본다. 로거를 갈아치울 때 고칠 곳이 한 곳이다.
export function trackEvent<N extends EventName>(name: N, props: EventProps[N]): void {
  track(name, props);
}

// 로그인·로그아웃에 붙는다. 시드 로그에서 userId가 로그인 이후 이벤트에만
// 있는 것과 같은 경계다.
export function identifyUser(userId: string): void {
  identify(userId);
}

export function resetUser(): void {
  reset();
}
