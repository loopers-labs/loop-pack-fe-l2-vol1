import { expect, test } from './auth.fixture';

test('세션이 만료되면 이유와 원래 보호 경로를 들고 로그인 화면으로 간다', async ({
  page,
}) => {
  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible();

  await page
    .context()
    .addCookies([{ name: 'scenario', value: 'expired', url: page.url() }]);
  await page.reload();

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === '/login' &&
      url.searchParams.get('reason') === 'expired' &&
      url.searchParams.get('next') === '/orders',
  );
  await expect(page.getByRole('status')).toHaveText(
    '세션이 만료되었습니다. 다시 로그인해주세요.',
  );
});
