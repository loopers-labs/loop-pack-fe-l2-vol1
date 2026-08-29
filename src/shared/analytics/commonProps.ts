export type Device = "mobile" | "tablet" | "desktop";

// UA 로 기기를 가른다. 태블릿을 모바일보다 먼저 판정한다 — 안드로이드 태블릿 UA 는 "Android"만 있고
// "Mobile" 이 없어서, mobile 규칙("android")을 먼저 태우면 태블릿을 모바일로 잘못 잡는다.
export function detectDevice(userAgent: string): Device {
  const ua = userAgent.toLowerCase();

  const isTablet =
    /ipad|tablet|playbook|silk|kindle/.test(ua) ||
    (/android/.test(ua) && !/mobile/.test(ua));

  if (isTablet) return "tablet";

  const isMobile = /mobi|iphone|ipod|android|blackberry|windows phone/.test(ua);

  if (isMobile) return "mobile";

  return "desktop";
}

// 탭(브라우저 인스턴스) 단위로 한 번 만들어 모든 이벤트에 붙일 세션 식별자. 예: "s_047z"
export function createSessionId(): string {
  return `s_${Math.random().toString(36).slice(2, 6)}`;
}
