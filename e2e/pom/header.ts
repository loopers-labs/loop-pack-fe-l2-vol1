import { expect, type Page } from '@playwright/test';

// 헤더 조작·단언 — 헤더 문구가 바뀌면 여기 1곳.
export const header = (page: Page) => page.getByRole('banner');

export async function expectLoggedInAs(page: Page, name: string) {
  await expect(header(page)).toContainText(`${name}님`);
  await expect(
    header(page).getByRole('button', { name: '로그아웃' }),
  ).toBeVisible();
}

export async function expectLoggedOut(page: Page) {
  await expect(
    header(page).getByRole('link', { name: '로그인' }),
  ).toBeVisible();
}

// 주문서는 헤더 링크로(client navigation) 가야 메모리 카트가 살아 있다.
export async function openCheckoutFromHeader(page: Page) {
  await header(page).getByRole('link', { name: '주문서' }).click();
}

export async function expectCartCount(page: Page, count: number) {
  await expect(header(page)).toContainText(`장바구니 ${count}`);
}
