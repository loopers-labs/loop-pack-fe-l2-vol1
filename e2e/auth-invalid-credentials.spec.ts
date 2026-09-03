import { test, expect } from './support/fixtures';

test.describe('잘못된 자격 증명', () => {
  // 로그인 실패를 검증하는 테스트라 storageState를 쓰지 않는다 — 이미
  // 로그인된 상태로 시작하면 애초에 무엇을 검증하는지 의미가 없어진다.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('비밀번호가 틀리면 에러 메시지가 표시되고 로그인 화면에 남는다', async ({
    page,
    account,
  }) => {
    await page.goto('/login');

    await page.getByLabel('이메일').fill(account.email);
    await page.getByLabel('비밀번호').fill('wrong-password');
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
