import { test, expect } from './support/fixtures';

// 3단계 RFC(docs/rfc/week09-e2e-scope.md)에서 고른 "주문" 시나리오: 정상 완료
// 흐름 1개. cartStore(zustand) → API 제출 → 화면 전환이 실제로 맞물리는지가
// 핵심이라, 담기 → 주문서 진입 → 제출 → 완료 확인까지 전체 사슬을 관통한다.
// 로그인 상태(storageState)로 시작한다 — 이 흐름은 이미 보호 경로 안이라
// 로그인 자체를 다시 검증할 필요가 없다.
test('상품을 담아 주문하면 주문내역에서 확인된다', async ({ page }) => {
  await page.goto('/products');

  const firstProduct = page.getByRole('article').first();
  const productName = await firstProduct
    .getByRole('heading', { level: 3 })
    .innerText();

  await firstProduct.getByRole('button', { name: /장바구니$/ }).click();

  await page.getByRole('link', { name: /장바구니 1/ }).click();
  await expect(page).toHaveURL('/orders/new');
  await expect(
    page.getByRole('heading', { name: '주문서', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: productName })).toBeVisible();

  await page.getByRole('button', { name: '주문하기' }).click();

  await expect(page).toHaveURL('/orders');
  await expect(
    page.getByRole('heading', { name: '주문내역', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: productName }).first(),
  ).toBeVisible();
});

// 3단계 RFC에서 놓쳤다가 4단계에서 보강한 케이스(과제가 "통합 테스트로
// 못 잡는 것"의 예시로 든 세 가지 중 하나): 로그인 상태(storageState)에서
// 홈에 원시 HTTP 요청을 보내 JS 실행 전 HTML에 이미 사용자 이름이 박혀
// 있는지 확인한다. jsdom엔 서버 렌더 단계 자체가 없어 검증 불가능한 지점.
test('로그인 상태면 초기 HTML에 이미 사용자 이름이 반영돼 있다', async ({
  page,
  account,
}) => {
  const response = await page.request.get('/');
  const html = await response.text();

  // React가 SSR에서 인접한 표현식({user.name} + '님') 사이에 hydration
  // 경계용 <!-- --> 주석을 끼워 넣어서(`루퍼1<!-- -->님`) 정확한 문자열
  // 이어붙임으로는 못 찾는다 — 브라우저 렌더링·hydration 시엔 사라지는
  // 주석이라 실제 화면엔 영향 없다. 그 주석을 허용하는 정규식으로 확인한다.
  expect(html).toMatch(new RegExp(`${account.name}(<!--\\s*-->)?님`));
});
