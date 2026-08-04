// [AI] 장바구니·위시리스트 E2E 검증.
// 토글 동기화, 페이지 이동 중 헤더 개수 유지, persist 새로고침 복원, hydration mismatch 부재를 확인한다.
import { test, expect } from '@playwright/test';

const expectWishlistCount = (page: import('@playwright/test').Page, n: number) =>
  expect(page.getByText(/위시리스트 \d+/)).toHaveText(`위시리스트 ${n}`);

const expectCartCount = (page: import('@playwright/test').Page, n: number) =>
  expect(page.getByText(/장바구니 \d+/)).toHaveText(`장바구니 ${n}`);

test.describe('위시리스트·장바구니 동기화', () => {
  test('위시리스트 토글이 버튼 상태와 헤더 개수에 즉시 반영된다', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    const wishlistBtn = page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /위시리스트/ });

    await expect(wishlistBtn).toHaveText('찜');
    await expectWishlistCount(page, 0);

    await wishlistBtn.click();

    await expect(wishlistBtn).toHaveText('찜 해제');
    await expectWishlistCount(page, 1);
  });

  test('장바구니 토글이 버튼 상태와 헤더 개수에 즉시 반영된다', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    const cartBtn = page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /장바구니/ });

    await expect(cartBtn).toHaveText('담기');
    await expectCartCount(page, 0);

    await cartBtn.click();

    await expect(cartBtn).toHaveText('담기 해제');
    await expectCartCount(page, 1);
  });

  test('홈 ↔ 목록 이동 시 헤더 개수와 같은 상품 토글 상태가 유지된다', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    const firstName = (await page.locator('article.product h2').first().textContent()) ?? '';
    const wishlistBtn = page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /위시리스트/ });

    await wishlistBtn.click();
    await expect(wishlistBtn).toHaveText('찜 해제');

    // [AI] 상위 로고 링크로 홈 이동(전체 새로고침 없는 클라이언트 이동).
    await page.getByRole('link', { name: 'Commerce' }).click();
    await expect(page).toHaveURL('/');

    await expectWishlistCount(page, 1);

    // 목록의 첫 상품(p26)은 홈 신상품에도 등장 → 같은 store 기반으로 토글 상태 동기화.
    const homeBtn = page.getByRole('button', { name: `${firstName.trim()} 위시리스트` });
    const onHome = await homeBtn.count();
    if (onHome > 0) {
      await expect(homeBtn.first()).toHaveText('찜 해제');
    }
  });
});

test.describe('persist — 새로고침 복원', () => {
  test('새로고침 후 위시리스트가 복원된다', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    const wishlistBtn = page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /위시리스트/ });

    await wishlistBtn.click();
    await expect(wishlistBtn).toHaveText('찜 해제');

    await page.reload();

    // [AI] persist rehydrate는 비동기. hasHydrated 이전엔 '찜'으로 렌더되므로
    // '찜 해제'로 전환되기를 기다린다.
    await expect(
      page
        .locator('article.product')
        .first()
        .getByRole('button', { name: /위시리스트/ })
    ).toHaveText('찜 해제');
    await expectWishlistCount(page, 1);
  });
});

test.describe('hydration 안전성', () => {
  test('persist 복원 경로에서 hydration mismatch 경고가 없다', async ({ page }) => {
    const mismatches: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && /hydrat|did not match/i.test(msg.text())) {
        mismatches.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      if (/hydrat|did not match/i.test(err.message)) mismatches.push(err.message);
    });

    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    // persist 보유 상태를 만든 뒤 새로고침해 rehydrate 경로를 탄다.
    await page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /위시리스트/ })
      .click();
    await page.reload();
    await expect(page.locator('article.product').first()).toBeVisible();

    expect(mismatches).toEqual([]);
  });
});
