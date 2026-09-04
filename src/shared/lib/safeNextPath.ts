// 로그인 후 돌아갈 경로를 검증한다.
//
// 이 값은 URL 쿼리로 들어오므로 **공격자가 고른다.** 그대로 redirect에 넣으면
// `?next=https://evil.example`로 우리 도메인을 발판 삼아 외부로 튕길 수 있다
// (open redirect). 그래서 "우리 앱 안의 경로"만 통과시킨다.
//
// 막아야 하는 모양:
//   https://evil.example   — 절대 URL
//   //evil.example         — 프로토콜 상대 URL. 브라우저는 이걸 외부로 읽는다
//   /\evil.example         — 일부 브라우저가 백슬래시를 슬래시로 정규화한다
//   javascript:alert(1)    — 스킴
//
// 허용: `/`로 시작하고 두 번째 글자가 `/`도 `\`도 아닌 것.
export const DEFAULT_NEXT_PATH = "/";

export function safeNextPath(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return DEFAULT_NEXT_PATH;
  }
  // 인코딩된 `%2F%2Fevil.example` 같은 값으로 검사를 통과시키는 경로를 막는다.
  // 못 읽는 값(깨진 퍼센트 이스케이프)은 우리가 만든 값이 아니므로 기본값으로 떨어뜨린다.
  let candidate: string;
  try {
    candidate = decodeURIComponent(value);
  } catch {
    return DEFAULT_NEXT_PATH;
  }

  if (!candidate.startsWith("/")) {
    return DEFAULT_NEXT_PATH;
  }
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return DEFAULT_NEXT_PATH;
  }
  return candidate;
}
