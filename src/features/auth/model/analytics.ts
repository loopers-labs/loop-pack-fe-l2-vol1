import { track } from "@/shared/analytics";

export type LoginFailReason = "credentials" | "server";

// 로그인 플로우가 소유한 이벤트. UI 는 이 동사들만 부른다.
// from 은 로그인 후 돌아갈 복원 경로(보호 경로 가드가 실어 보낸 값). 직접 진입이면 "/".
export function trackLoginStart(from: string): void {
  track("login_start", { props: { from } });
}

export function trackLoginSuccess(from: string): void {
  track("login_success", { props: { from } });
}

export function trackLoginFail(reason: LoginFailReason): void {
  track("login_fail", { props: { reason } });
}
