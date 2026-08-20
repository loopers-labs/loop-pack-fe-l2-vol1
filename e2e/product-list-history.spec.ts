import { expect, test } from '@playwright/test';

/**
 * 검증 항목 11·13·14 — URL 이 문서 경계를 넘어 살아남는가
 *
 * 세 항목이 한 파일에 있는 이유는 지키는 것이 같기 때문이다. 조건의 원본이 URL 이라는 결정이
 * **공유(11) · 뒤로/앞으로(13) · 새로고침(14)** 에서 각각 어떻게 드러나는지를 본다.
 *
 * 통합(jsdom)에서 못 하는 것만 여기 둔다.
 * `NuqsTestingAdapter` 는 URL 상태를 **누적하지 않고**(각 이벤트가 그 호출이 바꾼 조건만 담는다)
 * history 스택도 쌓지 않으며, jsdom 에는 문서 재로드가 없다.
 * 그래서 여러 조건이 쌓인 링크의 왕복과 `history: 'push'` 회귀는 오직 이 파일만 잡는다.
 *
 * 조건 하나를 바꿨을 때 목록이 반응하는가(8·9·10)는 문서 경계를 넘지 않으므로 통합에 남겼다.
 *
 * 대기는 전부 조건 기반이다. `sleep` 을 쓰지 않는다.
 */
const categorySelect = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: '카테고리' });
const sortSelect = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: '정렬' });
const searchInput = (page: import('@playwright/test').Page) => page.getByRole('textbox', { name: '검색' });

/** 목록이 실제로 도착했는지. mock API 의 500ms 실지연을 조건으로 기다린다. */
const waitForList = async (page: import('@playwright/test').Page) => {
  await expect(
    page.getByRole('region', { name: '상품 검색 결과' }).getByRole('heading', { level: 3 }).first(),
  ).toBeVisible();
};

/** 페이지네이션의 "현재 / 전체" 표시. 목록이 몇 페이지째인지 사용자가 보는 곳이다. */
const pageIndicator = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: '페이지 이동' });

test.describe('항목 11 — 조작이 URL에 반영 · URL로 재진입', () => {
  test('검색·카테고리·정렬을 차례로 고른 뒤 그 주소를 다시 열면 같은 조건의 목록을 본다', async ({ page }) => {
    await page.goto('/products');
    await waitForList(page);

    await searchInput(page).fill('셔츠');
    await page.getByRole('button', { name: '검색' }).click();
    await categorySelect(page).selectOption('fashion');
    await sortSelect(page).selectOption('price-desc');
    await expect(page).toHaveURL(/sort=price-desc/);

    // 조작으로 만들어진 주소를 그대로 복사해 새로 연다. 공유 링크를 받은 사람의 경험이다.
    const sharedLink = page.url();
    await page.goto('about:blank');
    await page.goto(sharedLink);

    await expect(searchInput(page)).toHaveValue('셔츠');
    await expect(categorySelect(page)).toHaveValue('fashion');
    await expect(sortSelect(page)).toHaveValue('price-desc');
  });

  // 경계 — 뒤쪽 페이지에서 조건을 바꾸면 1페이지 결과부터 봐야 한다
  test('3페이지에서 검색하면 1페이지 결과부터 본다', async ({ page }) => {
    await page.goto('/products?page=3');
    await expect(pageIndicator(page)).toContainText('3 / 3');

    await searchInput(page).fill('셔츠');
    await page.getByRole('button', { name: '검색' }).click();

    await expect(pageIndicator(page)).toContainText('1 /');
  });

  test('조건 초기화를 누르면 조건 없이 조회한 기본 목록으로 돌아간다', async ({ page }) => {
    await page.goto('/products?q=셔츠&category=fashion&sort=price-desc&page=2');
    await expect(searchInput(page)).toHaveValue('셔츠');

    await page.getByRole('button', { name: '조건 초기화' }).click();

    await expect(searchInput(page)).toHaveValue('');
    await expect(categorySelect(page)).toHaveValue('all');
    await expect(sortSelect(page)).toHaveValue('latest');
    await expect(page.getByRole('button', { name: '조건 초기화' })).toBeDisabled();
  });

  // 경계 — 없어진 카테고리가 담긴 오래된 링크로 들어와도 화면은 떠야 한다
  test('없는 조건이 담긴 링크로 들어와도 빈 화면 대신 기본 목록을 본다', async ({ page }) => {
    await page.goto('/products?category=nope&sort=nope&page=0');

    await waitForList(page);
    await expect(categorySelect(page)).toHaveValue('all');
    await expect(sortSelect(page)).toHaveValue('latest');
    await expect(pageIndicator(page)).toContainText('1 /');
  });
});

test.describe('항목 13 — 뒤로·앞으로 가기', () => {
  test('카테고리를 바꾼 뒤 뒤로 가면 이전 카테고리로 복원된다', async ({ page }) => {
    await page.goto('/products');
    await waitForList(page);
    await expect(categorySelect(page)).toHaveValue('all');

    await categorySelect(page).selectOption('fashion');
    await expect(page).toHaveURL(/category=fashion/);
    await waitForList(page);

    await page.goBack();

    await expect(categorySelect(page)).toHaveValue('all');
    await expect(page).not.toHaveURL(/category=fashion/);
  });

  test('뒤로 간 뒤 앞으로 가면 바꿨던 카테고리가 다시 적용된다', async ({ page }) => {
    await page.goto('/products');
    await waitForList(page);

    await categorySelect(page).selectOption('digital');
    await expect(page).toHaveURL(/category=digital/);

    await page.goBack();
    await expect(categorySelect(page)).toHaveValue('all');

    await page.goForward();

    await expect(categorySelect(page)).toHaveValue('digital');
    await expect(page).toHaveURL(/category=digital/);
  });

  // 경계 — 두 단계 이동한 뒤 한 단계만 되돌리면 중간 상태가 나와야 한다
  test('카테고리와 정렬을 차례로 바꾼 뒤 한 번만 뒤로 가면 카테고리는 남고 정렬만 되돌아간다', async ({ page }) => {
    await page.goto('/products');
    await waitForList(page);

    await categorySelect(page).selectOption('home');
    await expect(page).toHaveURL(/category=home/);

    await sortSelect(page).selectOption('price-desc');
    await expect(page).toHaveURL(/sort=price-desc/);

    await page.goBack();

    await expect(sortSelect(page)).toHaveValue('latest');
    await expect(categorySelect(page)).toHaveValue('home');
  });
});

test.describe('항목 14 — 새로고침', () => {
  test('조건이 걸린 URL 에서 새로고침해도 필터가 그대로 유지된다', async ({ page }) => {
    await page.goto('/products?q=셔츠&category=fashion&sort=price-asc');
    await expect(searchInput(page)).toHaveValue('셔츠');

    await page.reload();

    await expect(searchInput(page)).toHaveValue('셔츠');
    await expect(categorySelect(page)).toHaveValue('fashion');
    await expect(sortSelect(page)).toHaveValue('price-asc');
  });

  // 경계 — 화면에서 조작해 만든 조건도 새로고침을 견뎌야 한다
  test('화면에서 바꾼 조건도 새로고침 후 유지된다', async ({ page }) => {
    await page.goto('/products');
    await waitForList(page);

    await categorySelect(page).selectOption('goods');
    await expect(page).toHaveURL(/category=goods/);

    await page.reload();

    await expect(categorySelect(page)).toHaveValue('goods');
  });
});
