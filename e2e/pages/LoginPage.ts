import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async expectRedirectTarget(path: string, expired = false) {
    await expect(this.page).toHaveURL((url) => {
      return (
        url.pathname === '/login' &&
        url.searchParams.get('next') === path &&
        url.searchParams.get('expired') === (expired ? '1' : null)
      );
    });
  }

  async submit(email: string, password: string) {
    await this.page.getByRole('textbox', { name: '이메일' }).fill(email);
    await this.page.getByLabel('비밀번호').fill(password);
    await this.page.getByRole('button', { name: '로그인', exact: true }).click();
  }

  async expectFailure(message: string) {
    await expect(this.page.locator('form').getByRole('alert')).toHaveText(message);
  }

  async expectExpiredNotice() {
    await expect(this.page.getByRole('status')).toHaveText(
      '세션이 만료되었습니다. 다시 로그인해 주세요.',
    );
  }
}
