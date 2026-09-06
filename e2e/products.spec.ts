import { expect, test } from '@playwright/test';

test.describe('상품 목록', () => {
  test('직접 URL 진입과 새로고침에서 필터와 목록을 복원한다', async ({
    page,
  }) => {
    await page.goto('/products?category=digital&sort=price-asc');

    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
      'digital',
    );
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue(
      'price-asc',
    );
    await expect(
      page.getByRole('heading', {
        name: '신지루프 실리콘 핸드폰 핑거스트랩',
      }),
    ).toBeVisible();

    await page.reload();

    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
      'digital',
    );
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue(
      'price-asc',
    );
    await expect(
      page.getByRole('heading', {
        name: '신지루프 실리콘 핸드폰 핑거스트랩',
      }),
    ).toBeVisible();
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
});
