import { test, expect } from './support/fixtures';

test.describe('미로그인 → 로그인 → 원래 경로 복원', () => {
  // 로그인 자체를 검증하는 테스트라 storageState를 쓰지 않는다 — 이미
  // 로그인된 상태로 시작하면 이 흐름(가드 → 리다이렉트 → 로그인 → 복원)
  // 자체가 깨져도 테스트가 통과해버린다.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('보호 경로 접근 → 로그인 → 원래 경로로 복원된다', async ({
    page,
    account,
  }) => {
    await page.goto('/orders/new');

    // proxy.ts가 session 쿠키가 없는 요청을 여기서 걸러낸다.
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders%2Fnew/);

    await page.getByLabel('이메일').fill(account.email);
    await page.getByLabel('비밀번호').fill(account.password);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL('/orders/new');
    await expect(
      page.getByRole('heading', { name: '주문서', level: 1 }),
    ).toBeVisible();
  });
});
