import { expect, type Page } from '@playwright/test';

// 함수형 POM — 로그인 폼 조작은 이 파일에만 있다.
// 라벨·버튼 문구가 바뀌면 고칠 곳은 여기 1곳 (RFC C절 유지보수 비용 추정의 근거).

export type Credentials = { email: string; password: string };

export async function gotoLogin(page: Page, next?: string) {
  const query = next ? `?next=${encodeURIComponent(next)}` : '';
  await page.goto(`/login${query}`);
  await expect(page).toHaveURL(`/login${query}`);
}

export async function fillCredentials(page: Page, credentials: Credentials) {
  await page.getByLabel('이메일').fill(credentials.email);
  await page.getByLabel('비밀번호').fill(credentials.password);
}

export async function submitLogin(page: Page) {
  await page.getByRole('button', { name: '로그인' }).click();
}

// 로그인 화면에서 자격 증명을 넣고 제출한다. 어디로 가는지는 호출자가 단언한다.
export async function login(page: Page, credentials: Credentials) {
  await fillCredentials(page, credentials);
  await submitLogin(page);
}

// storageState 준비용: 로그인 화면으로 가서 로그인하고 헤더가 로그인 상태로 바뀔 때까지 기다린다.
export async function loginAs(
  page: Page,
  credentials: Credentials & { name: string },
) {
  await gotoLogin(page);
  await login(page, credentials);
  await expect(page.getByRole('banner')).toContainText(`${credentials.name}님`);
}
