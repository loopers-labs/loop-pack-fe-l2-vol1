import { expect, test } from '@playwright/test';

test.describe('인증', () => {
  test('비로그인 보호 경로에서 로그인한 뒤 원래 주문서로 돌아간다', async ({
    page,
  }) => {
    await page.goto('/orders/new');
    await expect(page).toHaveURL(
      '/login?returnTo=%2Forders%2Fnew',
    );
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();

    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL('/orders/new');
    await expect(
      page.getByRole('heading', { name: '주문할 상품이 없습니다' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: '주문 내역' })).toBeVisible();
  });

  test('잘못된 자격 증명은 로그인 화면에서 원인을 알려준다', async ({
    page,
  }) => {
    await page.goto('/login?returnTo=%2Forders');
    await page.getByLabel('비밀번호').fill('wrong-password');
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByText('이메일 또는 비밀번호를 확인해주세요.', { exact: true }),
    ).toBeVisible();
  });

  test('만료된 세션은 주문 내역의 재시도 화면 대신 로그인으로 이동한다', async ({
    page,
    context,
  }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL('/');

    await context.addCookies([
      {
        name: 'scenario',
        value: 'expired',
        domain: '127.0.0.1',
        path: '/',
      },
    ]);
    await page.goto('/orders');

    await expect(page).toHaveURL(/\/login\?returnTo=%2Forders/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });
});
