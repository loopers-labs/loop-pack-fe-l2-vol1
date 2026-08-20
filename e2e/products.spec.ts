import { expect, test } from '@playwright/test';

test.describe('상품 목록', () => {
  test('필터와 페이지 조작을 URL에 반영하고 같은 URL로 다시 진입한다', async ({
    page,
  }) => {
    await page.goto('/products');

    await page.getByRole('combobox', { name: '카테고리' }).selectOption('digital');
    await expect(page).toHaveURL(/category=digital/);
    await expect(page.getByRole('heading', { name: '메이커스 투명케이스' })).toBeVisible();

    await page.getByRole('combobox', { name: '정렬' }).selectOption('price-asc');
    await expect(page).toHaveURL(/sort=price-asc/);
    await expect(
      page.getByRole('heading', {
        name: '신지루프 실리콘 핸드폰 핑거스트랩',
      }),
    ).toBeVisible();

    await page.getByRole('combobox', { name: '카테고리' }).selectOption('all');
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page).toHaveURL(/page=2/);
    const savedUrl = page.url();

    await page.goto('/');
    await page.goto(savedUrl);

    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('all');
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('price-asc');
    await expect(page.getByText('2 / 3')).toBeVisible();

    await page.goto('/products?category=invalid&sort=invalid&page=0');
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('all');
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('latest');
    await expect(page.getByText('1 / 3')).toBeVisible();

    await page.goto('/products?page=-1');
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('all');
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('latest');
    await expect(page.getByText('1 / 3')).toBeVisible();
  });

  test('뒤로가기와 앞으로가기로 이전 카테고리와 상품 목록을 복원한다', async ({
    page,
  }) => {
    await page.goto('/products');
    const category = page.getByRole('combobox', { name: '카테고리' });

    await category.selectOption('fashion');
    await expect(page).toHaveURL(/category=fashion/);
    await expect(
      page.getByRole('heading', { name: '[FW23]아톰 후디 남성(6colors)' }),
    ).toBeVisible();

    await category.selectOption('home');
    await expect(page).toHaveURL(/category=home/);
    await expect(
      page.getByRole('heading', {
        name: '[STANLEY] 스탠리 클래식 포어 오버 커피 드리퍼 세트',
      }),
    ).toBeVisible();

    await page.goBack();
    await expect(category).toHaveValue('fashion');
    await expect(
      page.getByRole('heading', { name: '[FW23]아톰 후디 남성(6colors)' }),
    ).toBeVisible();

    await page.goForward();
    await expect(category).toHaveValue('home');
    await expect(
      page.getByRole('heading', {
        name: '[STANLEY] 스탠리 클래식 포어 오버 커피 드리퍼 세트',
      }),
    ).toBeVisible();
  });

  test('새로고침해도 URL의 카테고리와 정렬 상태를 유지한다', async ({ page }) => {
    await page.goto('/products');

    await page.getByRole('combobox', { name: '카테고리' }).selectOption('digital');
    await page.getByRole('combobox', { name: '정렬' }).selectOption('popular');
    await expect(page).toHaveURL(/category=digital/);
    await expect(page).toHaveURL(/sort=popular/);
    await expect(page.getByRole('heading', { name: '메이커스 투명케이스' })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('digital');
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('popular');
    await expect(page.getByRole('heading', { name: '메이커스 투명케이스' })).toBeVisible();
  });

  test('홈에서 상품 목록으로 이동해 같은 상품을 두 번 담아도 헤더 상품 수는 1이다', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '상품', exact: true }).click();
    await expect(page.getByRole('heading', { name: '상품 목록' })).toBeVisible();
    await expect(page.getByText('장바구니 0')).toBeVisible();

    const firstAddButton = page.getByRole('button', { name: '담기' }).first();
    await firstAddButton.click();
    await expect(page.getByText('장바구니 1')).toBeVisible();
    await page.getByRole('button', { name: '계속 쇼핑하기' }).click();

    await firstAddButton.click();
    await expect(page.getByText('장바구니 1')).toBeVisible();
  });
});
