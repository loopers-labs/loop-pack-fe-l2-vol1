// [AI] week08-test-plan.md E2E 항목 — items 11, 13, 14.
// URL 상태의 플랫폼 계약(실제 주소창·히스토리 스택·새로고침)을 검증한다.
// NuqsTestingAdapter는 인메모리 가짜 URL일 뿐 "사용자가 복사할 수 있는 실제 URL"을
// 증명 못 하므로(item 11) 실제 브라우저에서 검증한다. item 15(전체 여정)는
// cart-wishlist.spec.ts가 담당한다.
import { test, expect } from '@playwright/test';

const STANLEY_ENCODED = 'q=%EC%8A%A4%ED%83%A0%EB%A6%AC';

// [AI] item 11 — 조작이 URL에 반영 · URL로 재진입. state→URL, URL→state 양방향 계약.
// 빨간불이 되면 알게 되는 것: 필터를 바꿔도 주소창이 안 바뀌거나, URL로 직접 들어갔을 때
// 필터가 풀려있으면 URL state의 양방향 계약이 깨졌다는 것.
test.describe('item 11 — 조작이 실제 주소창 URL에 반영된다 (state → URL)', () => {
  test('검색어·카테고리·정렬 조작이 각각 URL에 반영된다', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    // [AI] getByLabel('검색')은 <section aria-label="상품 검색 결과">와 충돌하므로 name으로 고정.
    const search = page.locator('input[name="q"]');

    // 1) 검색어 입력(debounce 300ms 후 URL 반영)
    await search.fill('스탠리');
    await expect(page).toHaveURL(new RegExp(STANLEY_ENCODED));

    // 2) 카테고리 변경
    await page.locator('select[name="category"]').selectOption('digital');
    await expect(page).toHaveURL(/category=digital/);

    // 3) 정렬 변경
    await page.locator('select[name="sort"]').selectOption('popular');
    await expect(page).toHaveURL(/sort=popular/);
  });

  test('필터를 바꾸면 page가 1로 리셋되어 URL에서 page 파라미터가 사라진다', async ({ page }) => {
    await page.goto('/products?page=3');
    await expect(page.locator('nav[aria-label="페이지 이동"] span')).toHaveText(/^3 \//);

    // [AI] 필터를 바꾸면 page가 기본값 1로 돌아간다. nuqs는 기본값(1)을 URL에서 제거하므로
    // page=3이 URL에서 사라지고 페이지네이션 표시가 1로 바뀌는 것으로 reset을 확인한다.
    await page.locator('select[name="category"]').selectOption('digital');

    await expect(page).toHaveURL(/category=digital/);
    await expect(page).not.toHaveURL(/page=3/);
    await expect(page.locator('nav[aria-label="페이지 이동"] span')).toHaveText(/^1 \//);
  });
});

test.describe('item 11 — 공유 URL로 진입하면 필터가 복원된다 (URL → state)', () => {
  test('URL로 직접 진입하면 검색어·정렬이 복원되고 없는 필터는 기본값이다', async ({ page }) => {
    // [AI] 실제 공유 URL처럼 건 필터만 남긴다: 스탠리 검색 + 인기순 정렬.
    // category는 URL에 없음 → 기본값 all로 복원되는 것까지 함께 검증.
    // page.goto는 풀 로드라 자연스럽게 hydration 경로도 범위에 들어온다.
    await page.goto(`/products?${STANLEY_ENCODED}&sort=popular`);

    await expect(page.locator('article.product').first()).toBeVisible();

    await expect(page.locator('input[name="q"]')).toHaveValue('스탠리');
    await expect(page.locator('select[name="category"]')).toHaveValue('all');
    await expect(page.locator('select[name="sort"]')).toHaveValue('popular');
  });
});

// [AI] item 13 — 뒤로·앞으로 가기로 필터 복원. 실제 브라우저 히스토리 스택을 타야
// 의미가 있다(jsdom adapter는 흉내만 낸다). history:'push'로 쌓은 히스토리 계약.
// 빨간불이 되면 알게 되는 것: 뒤로 가도 이전 필터가 안 복원되면 push 계약이 깨졌다는 것.
test.describe('item 13 — 뒤로·앞으로 가기로 필터가 복원된다', () => {
  test('뒤로 가면 이전 필터 시점으로, 앞으로 가면 다음 필터 시점으로 복원된다', async ({
    page,
  }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    const search = page.locator('input[name="q"]');
    const category = page.locator('select[name="category"]');

    // 히스토리 스택 쌓기: [기본] → [검색어] → [검색어+카테고리]
    await search.fill('스탠리');
    await expect(page).toHaveURL(new RegExp(STANLEY_ENCODED));
    await category.selectOption('digital');
    await expect(page).toHaveURL(/category=digital/);

    // 뒤로 → 검색어만 있던 시점으로 복원
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(STANLEY_ENCODED));
    await expect(page).not.toHaveURL(/category=digital/);
    await expect(search).toHaveValue('스탠리');
    await expect(category).toHaveValue('all');

    // 앞으로 → 검색어+디지털 시점으로 복원
    await page.goForward();
    await expect(page).toHaveURL(/category=digital/);
    await expect(search).toHaveValue('스탠리');
    await expect(category).toHaveValue('digital');
  });
});

// [AI] item 14 — 새로고침해도 필터 상태가 유지. reload는 JS를 완전히 찢고
// SSR → hydration을 다시 타는 플랫폼 동작이라 jsdom이 재현 못 한다.
// persist(cart·wishlist) 복원은 같은 item 14라도 장바구니 로직이므로
// cart-wishlist.spec.ts가 담당한다. 여기는 URL 필터(nuqs) 채널만 검증한다.
test.describe('item 14 — 새로고침해도 URL 필터가 유지된다', () => {
  test('필터 변경 후 새로고침하면 URL과 필터 컨트롤이 복원된다', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    // 검색어·카테고리·정렬을 모두 바꿔 세 채널 모두 URL에 담는다
    await page.locator('input[name="q"]').fill('스탠리');
    await expect(page).toHaveURL(/q=/);
    await page.locator('select[name="category"]').selectOption('digital');
    await expect(page).toHaveURL(/category=digital/);
    await page.locator('select[name="sort"]').selectOption('popular');
    await expect(page).toHaveURL(/sort=popular/);

    await page.reload();

    await expect(page).toHaveURL(/q=.+&category=digital&sort=popular/);
    await expect(page.locator('input[name="q"]')).toHaveValue('스탠리');
    await expect(page.locator('select[name="category"]')).toHaveValue('digital');
    await expect(page.locator('select[name="sort"]')).toHaveValue('popular');
  });
});
