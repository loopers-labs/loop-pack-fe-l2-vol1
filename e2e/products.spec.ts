import { expect, test, type Page } from '@playwright/test';

const categoryFilter = (page: Page) =>
  page.getByRole('combobox', { name: '카테고리' });

const sortFilter = (page: Page) => page.getByRole('combobox', { name: '정렬' });

const pagination = (page: Page) =>
  page.getByRole('navigation', { name: '페이지 이동' });

const cartCount = (page: Page) => page.getByText(/^장바구니/);

const totalCount = (page: Page) => page.getByText(/^총 \d+개$/);

const products = (page: Page) =>
  page.getByRole('main').getByRole('heading', { level: 2 });

/** 시드 개수를 테스트에 박지 않고, 1페이지 화면에서 마지막 페이지 번호를 구한다 */
const readLastPage = async (page: Page) => {
  const total = Number(/\d+/.exec(await totalCount(page).innerText())?.[0]);
  const perPage = await products(page).count();

  return Math.ceil(total / perPage);
};

// 시드 값을 테스트에 박지 않고, 조작 전후의 화면을 서로 비교한다
const firstProduct = (page: Page) => products(page).first();

/**
 * 조건을 바꾸면 주소가 먼저 바뀌고 목록은 이전 것을 유지한 채 새 응답을 기다린다.
 * 그 사이에 화면을 읽으면 바뀌기 전 값을 잡는다.
 */
const waitForNewList = (page: Page, previousFirstName: string) =>
  expect(firstProduct(page)).not.toHaveText(previousFirstName);

test('필터를 바꾸면 주소에 남고, 그 주소로 다시 들어가도 같은 화면이다', async ({
  page,
}) => {
  await page.goto('/products');

  const beforeFirst = await firstProduct(page).innerText();
  const beforeTotal = await totalCount(page).innerText();

  await categoryFilter(page).selectOption({ label: '홈' });

  await expect(page).toHaveURL(/category=home/);
  await waitForNewList(page, beforeFirst);
  await expect(totalCount(page)).not.toHaveText(beforeTotal);

  const filteredTotal = await totalCount(page).innerText();
  const filteredFirst = await firstProduct(page).innerText();

  await page.goto(page.url());

  await expect(categoryFilter(page)).toHaveValue('home');
  await expect(totalCount(page)).toHaveText(filteredTotal);
  expect(await firstProduct(page).innerText()).toBe(filteredFirst);
});

test('범위를 벗어난 페이지로 들어가면 마지막 페이지로 보정된다', async ({
  page,
}) => {
  await page.goto('/products');

  const lastPage = await readLastPage(page);

  await page.goto('/products?page=99');

  await expect(page).toHaveURL(new RegExp(`page=${lastPage}(&|$)`));
  await expect(pagination(page)).toContainText(`${lastPage} / ${lastPage}`);
  await expect(
    pagination(page).getByRole('button', { name: '다음' }),
  ).toBeDisabled();
});

test('뒤로 가면 이전 조건이, 앞으로 가면 바꾼 조건이 돌아온다', async ({
  page,
}) => {
  await page.goto('/products');

  const beforeFirst = await firstProduct(page).innerText();
  const beforeTotal = await totalCount(page).innerText();

  await categoryFilter(page).selectOption({ label: '홈' });
  await expect(page).toHaveURL(/category=home/);
  await waitForNewList(page, beforeFirst);

  const filteredTotal = await totalCount(page).innerText();
  const filteredFirst = await firstProduct(page).innerText();

  await page.goBack();

  await expect(categoryFilter(page)).toHaveValue('all');
  await expect(totalCount(page)).toHaveText(beforeTotal);
  await expect(firstProduct(page)).toHaveText(beforeFirst);

  await page.goForward();

  await expect(page).toHaveURL(/category=home/);
  await expect(categoryFilter(page)).toHaveValue('home');
  await expect(totalCount(page)).toHaveText(filteredTotal);
  await expect(firstProduct(page)).toHaveText(filteredFirst);
});

test('페이지 보정은 히스토리에 남지 않아 뒤로 가면 원래 있던 곳으로 나간다', async ({
  page,
}) => {
  await page.goto('/products');
  await expect(totalCount(page)).toBeVisible();

  await page.goto('/products?page=99');
  await expect(page).not.toHaveURL(/page=99/);

  await page.goBack();

  await expect(page).toHaveURL(/\/products$/);
});

test('조건을 바꾸고 새로고침해도 같은 화면이다', async ({ page }) => {
  await page.goto('/products');

  const beforeFirst = await firstProduct(page).innerText();

  await categoryFilter(page).selectOption({ label: '홈' });
  await expect(page).toHaveURL(/category=home/);
  await waitForNewList(page, beforeFirst);

  const filteredTotal = await totalCount(page).innerText();
  const filteredFirst = await firstProduct(page).innerText();

  await page.reload();

  await expect(page).toHaveURL(/category=home/);
  await expect(categoryFilter(page)).toHaveValue('home');
  await expect(totalCount(page)).toHaveText(filteredTotal);
  expect(await firstProduct(page).innerText()).toBe(filteredFirst);
});

test('정렬과 페이지를 함께 바꾼 뒤 새로고침해도 둘 다 살아남는다', async ({
  page,
}) => {
  // 시드는 카테고리마다 한 페이지뿐이라, 페이지를 옮기려면 카테고리가 전체여야 한다
  await page.goto('/products');

  const beforeFirst = await firstProduct(page).innerText();

  await sortFilter(page).selectOption({ label: '낮은 가격순' });
  await expect(page).toHaveURL(/sort=price-asc/);
  await waitForNewList(page, beforeFirst);

  const sortedFirst = await firstProduct(page).innerText();

  await pagination(page).getByRole('button', { name: '다음' }).click();
  await expect(page).toHaveURL(/page=2/);
  await waitForNewList(page, sortedFirst);

  const movedFirst = await firstProduct(page).innerText();

  await page.reload();

  await expect(sortFilter(page)).toHaveValue('price-asc');
  await expect(
    pagination(page).getByRole('button', { name: '이전' }),
  ).toBeEnabled();
  expect(await firstProduct(page).innerText()).toBe(movedFirst);
});

test('목록에서 담으면 헤더 숫자가 오른다', async ({ page }) => {
  await page.goto('/products');
  await expect(cartCount(page)).toHaveText('장바구니 0');

  await page.getByRole('button', { name: /담기$/ }).first().click();

  await expect(cartCount(page)).toHaveText('장바구니 1');
});

test('담은 상품은 새로고침해도 남아 있다', async ({ page }) => {
  await page.goto('/products');
  await expect(cartCount(page)).toHaveText('장바구니 0');

  await page.getByRole('button', { name: /담기$/ }).first().click();
  await expect(cartCount(page)).toHaveText('장바구니 1');

  await page.reload();

  await expect(cartCount(page)).toHaveText('장바구니 1');
});
