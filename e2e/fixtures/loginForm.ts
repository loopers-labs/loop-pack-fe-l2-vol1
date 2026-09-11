import type { Page } from '@playwright/test';

interface LoginCredentials {
  email: string;
  password: string;
}

const DEFAULT_LOGIN_CREDENTIALS: LoginCredentials = {
  email: 'looper1@loopers.dev',
  password: 'looper1234',
};

export async function fillLoginForm(
  page: Page,
  credentials: LoginCredentials = DEFAULT_LOGIN_CREDENTIALS,
) {
  await page.getByLabel('이메일').fill(credentials.email);
  await page.getByLabel('비밀번호').fill(credentials.password);
}
