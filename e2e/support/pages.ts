import type { Page } from "@playwright/test";

// ── 셀렉터를 한 파일에 모은다 ───────────────────────────────────────────────
// 3단계에서 추정한 유지보수 비용이 여기서 결정된다. 문구가 바뀔 때 테스트 네 개가
// 같이 깨지지 않고 이 파일 한 곳만 고치면 되게 한다.
//
// 전부 역할과 이름 기반이다. `getByTestId`를 쓴 자리가 없다 — 이 앱은 라벨·역할이
// 이미 붙어 있어서 필요하지 않았다.
//
// ⚠️ 알림은 `main` 안으로 범위를 좁힌다. Next가 라우트 변경을 알리는
// `<div role="alert" id="__next-route-announcer__">`를 body에 심어서, 페이지 전체에서
// getByRole("alert")를 찾으면 항상 2개가 잡혀 strict mode 위반이 된다(실측).
// 8주차 통합 테스트에서는 이 문제가 없었다 — jsdom은 앱 레이아웃만 렌더하고
// Next의 런타임 주입은 일어나지 않는다. 진짜 브라우저에서만 나타나는 차이다.
const alertInMain = (page: Page) => page.getByRole("main").getByRole("alert");

export const loginPage = (page: Page) => ({
  email: () => page.getByLabel("이메일"),
  password: () => page.getByLabel("비밀번호"),
  // 제출 버튼은 진행 중에 문구가 "로그인하는 중…"으로 바뀐다. 앵커로 정확히 잡는다.
  submit: () => page.getByRole("button", { name: /^로그인$/ }),
  failure: () => alertInMain(page),

  async fillAndSubmit(email: string, password: string) {
    // 하이드레이션을 기다린다. 서버가 그린 폼은 JS가 붙기 전에도 보이고 클릭도
    // 되는데, 그때 누르면 onSubmit이 없어서 제출이 조용히 사라진다.
    // (2단계 실측에서 이걸로 30초 타임아웃을 봤다.)
    await this.submit().waitFor({ state: "visible" });
    await this.email().fill(email);
    await this.password().fill(password);
    await this.submit().click();
  },
});

export const header = (page: Page) => ({
  account: (name: string) => page.getByLabel(`로그인 계정 ${name}`),
  loginLink: () => page.getByRole("link", { name: "로그인" }),
  logout: () => page.getByRole("button", { name: "로그아웃" }),
  // 서버가 세션을 판정하지 않았을 때만 나오는 자리(Header의 AccountNav).
  pending: () => page.getByText("계정 확인 중"),
});

// ── 초기 HTML을 한 값으로 접는다 ────────────────────────────────────────────
// 5단계 E6("초기 HTML의 로그인 상태를 지웠다")이 절반만 짚인 이유는, 계정 라벨
// 하나에 "서버가 그렸음"과 "로그인됨"이 겹쳐 있어서였다. 라벨을 못 찾았다는
// 사실만으로는 서버 렌더가 빠진 것인지 로그인이 안 된 것인지 알 수 없다.
//
// 헤더가 세 상태를 세 모양으로 그리므로, 초기 HTML 문자열만 보고 셋을 가를 수 있다.
// **문자열을 값으로 대조한다** — E1·E2에서 주소를 값으로 찍은 것이 가장 잘 읽혔고
// (`Expected … / Received …` 한 쌍이 원인을 말했다) 같은 방식이다.
// `not.toContain`을 늘어놓으면 "무엇이 아니다"만 남고 무엇이었는지는 안 남는다.
export const SERVER_SESSION = {
  login: "로그인 계정을 그렸다",
  unresolved: "세션을 판정하지 않았다 — (shop) layout의 주입이 빠졌다",
  expired: "만료로 그렸다 — 쿠키가 서버 검증에서 떨어졌다",
  anonymous: "미로그인으로 그렸다 — 쿠키가 없거나 로그인이 안 됐다",
} as const;

export function serverRenderedSession(html: string, accountName: string): string {
  if (html.includes(`로그인 계정 ${accountName}`)) {
    return SERVER_SESSION.login;
  }
  if (html.includes("계정 확인 중")) {
    return SERVER_SESSION.unresolved;
  }
  if (html.includes("세션이 만료되었습니다")) {
    return SERVER_SESSION.expired;
  }
  return SERVER_SESSION.anonymous;
}

export const checkoutPage = (page: Page) => ({
  heading: () => page.getByRole("heading", { name: "주문서", level: 1 }),
  total: () => page.getByRole("region", { name: "주문 상품" }),
  submit: () => page.getByRole("button", { name: /^주문하기$/ }),
  failure: () => alertInMain(page),
});

export const ordersPage = (page: Page) => ({
  heading: () => page.getByRole("heading", { name: "주문 내역", level: 1 }),
  list: () => page.getByRole("region", { name: "주문 목록" }),
  empty: () => page.getByText(/주문한 상품이 없습니다/),
  failure: () => alertInMain(page),
});
