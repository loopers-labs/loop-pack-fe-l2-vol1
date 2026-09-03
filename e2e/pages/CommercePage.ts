import { expect, type Page } from '@playwright/test';

export class CommercePage {
  constructor(private readonly page: Page) {}

  async addFirstProductToCart() {
    await this.page.goto('/products');
    await expect(this.page.getByRole('region', { name: '상품 검색 결과' })).toBeVisible();

    const navigation = this.page.getByRole('navigation', { name: '주요 메뉴' });
    const addButton = this.page.getByRole('button', { name: '1번 상품 담기', exact: true });

    await addButton.click();
    await expect(addButton).toHaveAttribute('aria-pressed', 'true');
    await expect(navigation.getByRole('link', { name: '장바구니 1' })).toBeVisible();
  }

  async openCart() {
    await this.page
      .getByRole('navigation', { name: '주요 메뉴' })
      .getByRole('link', { name: '장바구니 1' })
      .click();
  }

  async expectOrderFormWithOneProduct() {
    await expect(this.page).toHaveURL('/orders/new');
    await expect(this.page.getByRole('heading', { name: '주문서' })).toBeVisible();
    const item = this.page.getByRole('region', { name: '주문 상품' }).getByRole('listitem');
    await expect(item).toHaveCount(1);

    const text = await item.textContent();
    const productId = text?.match(/p\d+/)?.[0];
    if (productId === undefined) {
      throw new Error('주문 상품에서 상품 ID를 찾지 못했습니다.');
    }

    return productId;
  }

  async submitOrder(productId: string) {
    await this.page.getByRole('button', { name: '주문하기' }).click();
    await expect(this.page).toHaveURL('/orders');
    await expect(this.page.getByRole('heading', { name: '주문 내역' })).toBeVisible();
    await expect(
      this.page.getByRole('cell', { name: productId, exact: true }).first(),
    ).toBeVisible();
    await expect(
      this.page
        .getByRole('navigation', { name: '주요 메뉴' })
        .getByRole('link', { name: '장바구니 0' }),
    ).toBeVisible();
  }
}
