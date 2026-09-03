import type { Locator, Page } from "@playwright/test";

// 로그인 화면의 셀렉터를 한 곳에 모은다. 라벨·버튼 문구가 바뀌면 여기만 고친다
export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly expiredNotice: Locator;

  constructor(private readonly page: Page) {
    const form = page.getByRole("form", { name: "로그인" });
    this.emailInput = form.getByLabel("이메일");
    this.passwordInput = form.getByLabel("비밀번호");
    this.submitButton = form.getByRole("button", { name: "로그인" });
    this.errorAlert = form.getByRole("alert");
    this.expiredNotice = page.getByRole("alert").filter({ hasText: "세션이 만료되었어요" });
  }

  goto(query = "") {
    return this.page.goto(`/login${query}`);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
