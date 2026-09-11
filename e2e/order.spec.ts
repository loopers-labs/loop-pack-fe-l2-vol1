import { expect, test } from './fixtures';
import {
  expectCartCount,
  expectLoggedInAs,
  openCheckoutFromHeader,
} from './pom/header';

// E4 (RFC C절). 로그인 상태(storageState)에서 담기 → 주문서 → 주문 → 내역.
// 통합이 못 보는 것: 메모리 카트가 페이지 이동을 건너 살아 있는가, 주문 후 서버 데이터가 실제로 늘었는가.
test('E4 담은 상품으로 주문하면 주문 내역이 하나 늘고 장바구니는 비워진다', async ({
  page,
  account,
}) => {
  // 이 워커 계정의 현재 주문 수 — 같은 서버 프로세스 안에서 앞 실행의 주문이 남아 있을 수 있으므로
  // 절대 개수("1건")가 아니라 상대값(+1)으로 단언한다.
  await page.goto('/orders');
  await expect(page).toHaveURL('/orders');
  await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible();
  // 헤딩은 로딩 중에도 보인다. count()는 재시도하지 않으므로 목록이 도착하기 전에 세면 0이 나오고,
  // 서버에 이 계정의 이전 주문이 남아 있을 때 아래 +1 단언이 틀어진다. 로딩 표시가 사라진 뒤에 센다.
  await expect(page.getByRole('status')).toHaveCount(0);
  const ordersBefore = await page
    .getByRole('region', { name: '주문 내역' })
    .getByRole('listitem')
    .count();

  await page.goto('/products');
  await expect(page).toHaveURL('/products');
  await expectLoggedInAs(page, account.name);

  await page
    .getByRole('button', { name: /장바구니$/ })
    .first()
    .click();
  await expectCartCount(page, 1);

  await openCheckoutFromHeader(page);
  await expect(page).toHaveURL('/checkout');
  await expect(
    page.getByRole('list', { name: '주문 상품' }).getByRole('listitem'),
  ).toHaveCount(1);

  await page.getByRole('button', { name: '주문하기' }).click();

  await expect(page).toHaveURL('/orders');
  await expect(
    page.getByRole('region', { name: '주문 내역' }).getByRole('listitem'),
  ).toHaveCount(ordersBefore + 1);
  await expectCartCount(page, 0);
});
