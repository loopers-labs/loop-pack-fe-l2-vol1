import { track } from "@/shared/analytics";

export type LoginFailReason = "credentials" | "server";

// 로그인 플로우가 소유한 이벤트. UI 는 이 동사들만 부른다.
export function trackLoginStart(): void {
  track("login_start", { props: {} });
}

export function trackLoginSuccess(): void {
  track("login_success", { props: {} });
}

export function trackLoginFail(reason: LoginFailReason): void {
  track("login_fail", { props: { reason } });
}
