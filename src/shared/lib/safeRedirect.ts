// 로그인 후 돌아갈 경로를 검증한다. proxy(edge)·RSC·클라가 같은 함수를 써 검증이 갈라지지 않게 한다.
// crypto가 없어 전 런타임에서 돈다.
//
// 입력은 이미 URLSearchParams(서버 `nextUrl.searchParams`·클라 `window.location`)가 한 번 디코드한 값이다.
// 여기서 다시 디코드하지 않는다 — 재디코드하면 이중 인코딩(`%252F%252F` → `//`)으로 외부 주소 우회가 열린다.
export function safeRedirect(value: string | null | undefined, fallback = "/"): string {
  // 내부 절대 경로만 허용한다. 스킴·호스트로 시작하면(외부·상대) 버린다.
  if (!value || !value.startsWith("/")) {
    return fallback;
  }
  // protocol-relative(`//host`)와 백슬래시 변형(`/\host`, 브라우저가 `//`로 취급)은 외부로 나간다.
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  let url: URL;
  try {
    // origin을 고정해 파싱하므로 결과는 항상 내부다. 경로 정규화(`.`·`..`)도 여기서 처리된다.
    url = new URL(value, "http://internal.invalid");
  } catch {
    return fallback;
  }

  const { pathname } = url;
  // 정규화된 경로 기준으로 검사한다 — `/foo/../login` 같은 traversal이 접두 검사를 우회하지 못하게.
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");
  const isLoginLoop = pathname === "/login" || pathname.startsWith("/login/");
  if (isApiRoute || isLoginLoop) {
    return fallback;
  }

  // 호스트·해시는 버리고 경로·쿼리만 돌려준다.
  return pathname + url.search;
}
