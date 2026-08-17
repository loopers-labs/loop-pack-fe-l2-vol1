// [AI] 장바구니·위시리스트 E2E 검증 (week08-test-plan.md items 12·14·15 + 보완).
// 통합(ProductList.interactions)이 담당하는 토글→헤더 wiring과는 층을 나눠,
// E2E는 실제 브라우저에서만 재현되는 플랫폼 경로(라우팅·reload·hydration)만 검증한다.
import { test, expect } from '@playwright/test';

const expectWishlistCount = (page: import('@playwright/test').Page, n: number) =>
  expect(page.getByText(/위시리스트 \d+/)).toHaveText(`위시리스트 ${n}`);

const expectCartCount = (page: import('@playwright/test').Page, n: number) =>
  expect(page.getByText(/장바구니 \d+/)).toHaveText(`장바구니 ${n}`);

// [AI] persist 보완 — 페이지 이동은 클라이언트 라우팅이므로 재시작이 없다.
// 메모리 상태가 페이지 전환을 건너 유지되는지(새로고침이 아닌 이동)를 검증한다.
test.describe('item 12 보완 — 홈 ↔ 목록 이동 시 상태가 유지된다', () => {
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

// [AI] item 15 — 전체 여정 smoke. "진입 → 담기 → 헤더"가 production build에서
// 이어지는지만 잡는다(조립 누락·hydration 결함·런타임 에러 계층).
// 버튼 텍스트 전환·재클릭 해제 등 상세 wiring은 통합 테스트(ProductList.interactions
// item 12)가 이미 검증하므로 여기서 중복 단언하지 않는다(층 분리 — week08-test-plan.md 판단 2).
test.describe('item 15 — 전체 여정: 목록 진입 → 담기 → 헤더 확인', () => {
  test('풀 로드 진입 후 담으면 헤더 장바구니 개수가 오른다', async ({ page }) => {
    await page.goto('/products');

    const cartBtn = page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /장바구니/ });

    // 진입 확인: 풀 로드 + hydration 직후 실제 DOM에 버튼이 있다
    await expect(cartBtn).toBeVisible();
    await expectCartCount(page, 0);

    await cartBtn.click();

    await expectCartCount(page, 1);
  });
});

// [AI] item 14(persist 파트) — 새로고침(reload)은 JS를 완전히 찢고 SSR → hydration을
// 다시 타는 플랫폼 동작이라 jsdom이 재현 못 한다. 상태를 주입(storageState)하지 않고
// 실제 조작으로 만드는 이유: persist의 쓰기 경로와 읽기 경로를 모두 검증해야
// "장바구니가 비어있으면 복원 계약이 깨진 것"을 잡을 수 있다.
// URL 필터(nuqs) 채널의 새로고침 복원은 navigation.spec.ts의 item 14가 담당한다.
test.describe('item 14 — 새로고침해도 장바구니와 위시리스트가 유지된다', () => {
  test('담기·찜 후 새로고침하면 두 persist 상태가 모두 복원된다', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    // 담기 + 찜 — 서로 다른 store가 각각 localStorage에 persist로 기록한다
    await page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /장바구니/ })
      .click();
    await expectCartCount(page, 1);
    await page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /위시리스트/ })
      .click();
    await expectWishlistCount(page, 1);

    await page.reload();

    await expectCartCount(page, 1);
    await expectWishlistCount(page, 1);
  });
});

// [AI] hydration 보완 — persist 보유 상태로 새로고침할 때 React가 콘솔에 내는
// hydration mismatch 경고가 없는지 검증한다. mismatch는 서버 HTML과 브라우저
// 첫 렌더의 불일치로, 풀 로드 + 실제 브라우저에서만 재현되는 결함이다.
test.describe('item 14 보완 — persist 복원 경로에서 hydration mismatch가 없다', () => {
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
