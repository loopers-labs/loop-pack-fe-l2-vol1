import { expect, test } from '@playwright/test';

test.describe('장바구니', () => {
  test('로그인하면 비회원 장바구니를 회원 장바구니에 합치고 비운다', async ({
    page,
    context,
  }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: '담기' }).first().click();
    await page.getByRole('button', { name: '계속 쇼핑하기' }).click();
    await expect(page.getByRole('link', { name: /장바구니 1/ })).toBeVisible();

    const guestPage = await context.newPage();
    await guestPage.goto('/cart');
    await expect(
      guestPage.getByRole('link', { name: /장바구니 1/ }),
    ).toBeVisible();

    await page.getByRole('link', { name: /장바구니 1/ }).click();
    await expect(page).toHaveURL('/cart');
    await page.getByRole('link', { name: '주문하기' }).click();
    await expect(page).toHaveURL(/\/login\?returnTo=%2Forders%2Fnew/);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL('/orders/new');
    await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible();
    await expect(page.getByText('총 1개', { exact: true })).toBeVisible();
    await expect(
      guestPage.getByRole('button', { name: '로그아웃' }),
    ).toBeVisible();
    await expect(
      guestPage.getByRole('link', { name: /장바구니 1/ }),
    ).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: '장바구니' })).toBeVisible();
    await expect(page.getByRole('link', { name: /장바구니 1/ })).toBeVisible();

    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL('/');
    await expect(guestPage.getByRole('link', { name: '로그인' })).toBeVisible();
    await expect(
      guestPage.getByRole('link', { name: /장바구니 0/ }),
    ).toBeVisible();
    await guestPage.close();
    await page.getByRole('link', { name: /장바구니 0/ }).click();

    await expect(page).toHaveURL('/cart');
    await expect(
      page.getByRole('heading', {
        name: '장바구니에 담긴 상품이 없어요.',
      }),
    ).toBeVisible();
  });
});
