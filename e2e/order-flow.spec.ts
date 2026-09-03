import { expect, test } from './fixtures/worker-auth';

/**
 * RFC C-1 항목 6 (docs/rfc/week09-e2e-scope.md) — 돈이 움직이는 유일한 경로.
 *
 * `worker-auth` fixture 로 이미 로그인된 상태에서 시작한다. 이 시나리오가 지키는 것은
 * 로그인 자체가 아니라 담기→주문 흐름이고, `/order` 가 보호 경로라 어차피 로그인 없이는
 * 도달할 수 없다.
 *
 * 단언은 사용자가 화면에서 보는 상태까지만 한다. `page.waitForResponse` 로 응답 코드를
 * 확인하지 않는다.
 */
test.describe('항목 6 — 상세에서 담아 주문하면 주문 완료를 본다', () => {
  test('상품 상세에서 담은 뒤 주문하면 주문 완료 화면이 뜬다', async ({ page }) => {
    await page.goto('/products/p1');

    const addButton = page.getByRole('button', { name: /장바구니$/ });
    await addButton.click();
    await expect(addButton).toHaveAttribute('aria-pressed', 'true');

    const header = page.getByRole('banner');
    const cartLink = header.getByRole('link', { name: '장바구니 1' });
    await expect(cartLink).toBeVisible();

    await cartLink.click();
    await expect(page.getByRole('heading', { name: '주문하기' })).toBeVisible();

    await page.getByRole('button', { name: '주문하기' }).click();

    await expect(page.getByRole('heading', { name: '주문 완료' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(/주문이 완료되었습니다\. 주문번호 /);
    await expect(page.getByRole('link', { name: '주문 내역 보기' })).toBeVisible();
  });
});
