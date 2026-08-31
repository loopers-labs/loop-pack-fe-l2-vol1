import { expect, test } from '@playwright/test';

test.describe('장바구니', () => {
  test('비로그인 장바구니는 공개되고 주문서 진입에서 로그인을 요구한다', async ({
    page,
  }) => {
    await page.goto('/cart');

    await expect(page).toHaveURL('/cart');
    await expect(
      page.getByRole('heading', {
        name: '장바구니에 담긴 상품이 없어요.',
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: '상품 담으러 가기' })).toHaveAttribute(
      'href',
      '/products',
    );
    await expect(page.getByRole('heading', { name: '전체상품' })).toBeVisible();
  });

  test('로그인과 로그아웃 시 회원·비회원 장바구니를 분리해 전환한다', async ({
    page,
  }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: '담기' }).first().click();
    await page.getByRole('button', { name: '계속 쇼핑하기' }).click();
    await expect(page.getByRole('link', { name: /장바구니 1/ })).toBeVisible();

    await page.getByRole('link', { name: /장바구니 1/ }).click();
    await expect(page).toHaveURL('/cart');
    await page.getByRole('link', { name: '주문하기' }).click();
    await expect(page).toHaveURL(/\/login\?returnTo=%2Forders%2Fnew/);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL('/orders/new');

    await page.goto('/cart');
    await expect(
      page.getByRole('heading', {
        name: '장바구니에 담긴 상품이 없어요.',
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /장바구니 0/ })).toBeVisible();

    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL('/');
    await page.getByRole('link', { name: /장바구니 1/ }).click();

    await expect(page).toHaveURL('/cart');
    await expect(page.getByRole('heading', { name: '장바구니' })).toBeVisible();
  });
});
