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
});

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
