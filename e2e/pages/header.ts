import type { Locator, Page } from "@playwright/test";

// 헤더의 로그인 상태 표시. 마이페이지 본문에도 같은 이름의 링크·버튼이 있어 주요 메뉴 nav 로 범위를 좁힌다
export class Header {
  readonly nav: Locator;
  readonly loginLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.nav = page.getByRole("navigation", { name: "주요 메뉴" });
    this.loginLink = this.nav.getByRole("link", { name: "로그인" });
    this.logoutButton = this.nav.getByRole("button", { name: "로그아웃" });
  }

  greeting(name: string) {
    return this.nav.getByText(`${name}님`);
  }

  cartLink(count: number) {
    return this.nav.getByRole("link", { name: `장바구니 ${count}` });
  }
}
