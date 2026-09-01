import { expect, test } from '@playwright/test';

test.describe('상품 목록', () => {
  test('필터를 URL로 복원하고 잘못된 조건은 기본값으로 정리한다', async ({
    page,
  }) => {
    await page.goto('/products');

    await page
      .getByRole('combobox', { name: '카테고리' })
      .selectOption('digital');
    await expect(page).toHaveURL(/category=digital/);
    await expect(
      page.getByRole('heading', { name: '메이커스 투명케이스' }),
    ).toBeVisible();

    await page
      .getByRole('combobox', { name: '정렬' })
      .selectOption('price-asc');
    await expect(page).toHaveURL(/sort=price-asc/);
    await expect(
      page.getByRole('heading', {
        name: '신지루프 실리콘 핸드폰 핑거스트랩',
      }),
    ).toBeVisible();

    const savedUrl = page.url();
    await page.goto('/');
    await page.goto(savedUrl);

    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
      'digital',
    );
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue(
      'price-asc',
    );

    await page.goto('/products?category=invalid&sort=invalid&page=2');
    await expect(page).not.toHaveURL(/(?:\?|&)page=/);
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
      'all',
    );
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue(
      'latest',
    );
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

  test('새로고침해도 필터와 장바구니·위시리스트 상태를 유지한다', async ({
    page,
  }) => {
    await page.goto('/products');

    await page
      .getByRole('combobox', { name: '카테고리' })
      .selectOption('digital');
    await page
      .getByRole('combobox', { name: '정렬' })
      .selectOption('popular');
    await expect(page.getByText('장바구니 0')).toBeVisible();
    await expect(page.getByText('위시리스트 0')).toBeVisible();

    await page.getByRole('button', { name: '찜' }).first().click();
    await page.getByRole('button', { name: '담기' }).first().click();
    await expect(page.getByText('장바구니 1')).toBeVisible();
    await expect(page.getByText('위시리스트 1')).toBeVisible();
    await page.getByRole('button', { name: '계속 쇼핑하기' }).click();

    await page.reload();

    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
      'digital',
    );
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue(
      'popular',
    );
    await expect(page.getByText('장바구니 1')).toBeVisible();
    await expect(page.getByText('위시리스트 1')).toBeVisible();
    await expect(page.getByRole('button', { name: '찜 해제' }).first()).toBeVisible();
  });

});
