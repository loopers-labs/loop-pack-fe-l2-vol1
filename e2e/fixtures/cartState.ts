import type { Page } from '@playwright/test';

interface TestCartItem {
  id: string;
  quantity: number;
}

type TestCartOwner = 'guest' | `user:${string}`;

export const TEST_CART_PRODUCT = {
  id: 'p4',
  name: '[Exclusive] PLAIN COTTON CASHMERE CARDIGAN (5 COLORS)',
} as const;

export async function seedCartState(
  page: Page,
  owner: TestCartOwner,
  items: TestCartItem[],
): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    ({ storageKey, cartItems }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ state: { items: cartItems }, version: 1 }),
      );
    },
    {
      storageKey: `aesthetic-cart:${owner}`,
      cartItems: items,
    },
  );
}
