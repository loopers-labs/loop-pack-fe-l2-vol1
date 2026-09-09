import { expect, test } from '@playwright/test';
import { seedCartState, TEST_CART_PRODUCT } from './fixtures/cartState';
import { fillLoginForm } from './fixtures/loginForm';
import { setExpiredSessionCookie } from './fixtures/session';

test.describe('인증', () => {
  test('비로그인 보호 경로에서 로그인한 뒤 원래 주문서로 돌아간다', async ({
    page,
  }) => {
    await page.goto('/orders/new');
    await expect(page).toHaveURL(
      '/login?returnTo=%2Forders%2Fnew',
    );
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();

    await fillLoginForm(page);
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
    await fillLoginForm(page, {
      email: 'looper1@loopers.dev',
      password: 'wrong-password',
    });
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByText('이메일 또는 비밀번호를 확인해주세요.', { exact: true }),
    ).toBeVisible();
  });

  test('실제로 만료된 세션 토큰으로 보호 문서에 접근하면 로그인으로 이동한다', async ({
    page,
    context,
    baseURL,
  }) => {
    await setExpiredSessionCookie(context, baseURL);
    await page.goto('/orders');

    await expect(page).toHaveURL(/\/login\?returnTo=%2Forders/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('열린 주문서의 주문 API가 401이면 현재 경로를 보존해 로그인으로 이동한다', async ({
    page,
    context,
    baseURL,
  }) => {
    await page.goto('/login');
    await fillLoginForm(page);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL('/');

    await seedCartState(page, 'user:u1', [
      { id: TEST_CART_PRODUCT.id, quantity: 1 },
    ]);
    await page.goto('/orders/new');

    const submitButton = page.getByRole('button', { name: /원 주문하기/ });
    await expect(submitButton).toBeEnabled();

    // 문서는 유효한 세션으로 렌더링한 뒤 API 호출 직전에 토큰만 만료시킨다.
    await setExpiredSessionCookie(context, baseURL);

    const createOrderResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/orders') &&
        response.request().method() === 'POST',
    );

    await submitButton.click();

    const response = await createOrderResponse;
    expect(response.status()).toBe(401);
    await expect(page).toHaveURL(
      '/login?returnTo=%2Forders%2Fnew&loginSource=orders',
    );
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('외부 복원 경로가 주어져도 로그인 뒤 애플리케이션 origin을 벗어나지 않는다', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) {
      throw new Error('Playwright baseURL이 필요합니다.');
    }

    await page.goto('/login?returnTo=%2F%2Fevil.example');
    await fillLoginForm(page);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL('/');
    expect(new URL(page.url()).origin).toBe(new URL(baseURL).origin);
    await expect(page.getByRole('link', { name: '주문 내역' })).toBeVisible();
  });
});
