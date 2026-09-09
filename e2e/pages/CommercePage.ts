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

  /** 주문을 제출하고 주문 내역에 기록됐는지까지 본다 */
  async completeOrder(productId: string) {
    await this.page.getByRole('button', { name: '주문하기' }).click();
    await expect(this.page).toHaveURL('/orders');
    await expect(this.page.getByRole('heading', { name: '주문 내역' })).toBeVisible();
    await expect(
      this.page.getByRole('cell', { name: productId, exact: true }).first(),
    ).toBeVisible();
  }

  /**
   * 주문 뒤 장바구니가 비워졌는지 본다.
   *
   * 주문 기록과 따로 둔다. 한 덩어리로 두면 "주문이 안 됐다"와 "주문은 됐는데 장바구니가
   * 안 비워졌다"가 같은 step 실패로 보고돼 무엇이 깨졌는지 갈리지 않는다.
   */
  async expectCartCleared() {
    await expect(
      this.page
        .getByRole('navigation', { name: '주요 메뉴' })
        .getByRole('link', { name: '장바구니 0' }),
    ).toBeVisible();
  }
}
