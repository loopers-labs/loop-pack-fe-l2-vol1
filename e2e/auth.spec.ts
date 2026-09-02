import { expect, test } from '@playwright/test';

import { getTestAccount, submitLoginForm } from './auth.fixture';

const account = getTestAccount(0);

test.use({ storageState: { cookies: [], origins: [] } });

test('미로그인 사용자는 로그인 후 원래 보호 경로로 돌아온다', async ({
  page,
}) => {
  await page.goto('/orders/new');

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === '/login' &&
      url.searchParams.get('next') === '/orders/new',
  );

  await submitLoginForm(page, account);

  await expect(page).toHaveURL((url) => url.pathname === '/orders/new');
  await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible();

  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'session',
  );
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe('Lax');
});

test('잘못된 자격 증명은 로그인 화면에 오류를 남기고 세션을 만들지 않는다', async ({
  page,
}) => {
  await page.goto('/login');
  await page
    .context()
    .addCookies([{ name: 'scenario', value: 'invalid', url: page.url() }]);

  await submitLoginForm(page, account);

  await expect(
    page.getByRole('form', { name: '로그인' }).getByRole('alert'),
  ).toHaveText('이메일 또는 비밀번호를 확인해주세요.');
  await expect(page).toHaveURL('/login');

  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'session',
  );
  expect(sessionCookie).toBeUndefined();
});
