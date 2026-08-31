// @vitest-environment jsdom

import '@/test/setupDom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { LEGACY_CART_STORAGE_KEY } from './cartOwner';
import { CartStoreProvider } from './CartStoreProvider';
import { useCartStore } from './useCartStore';
import type { CartOwnerKey } from './cartOwner';

function CartProbe() {
  const ownerKey = useCartStore((state) => state.ownerKey);
  const items = useCartStore((state) => state.items);
  const isHydrated = useCartStore((state) => state.isHydrated);
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div>
      <p>{`${ownerKey}:${isHydrated ? Array.from(items.keys()).join(',') || 'empty' : 'loading'}`}</p>
      <button type="button" onClick={() => addItem('p1')}>
        상품 담기
      </button>
    </div>
  );
}

function ProviderHarness({ ownerKey }: { ownerKey: CartOwnerKey }) {
  return (
    <CartStoreProvider ownerKey={ownerKey}>
      <CartProbe />
    </CartStoreProvider>
  );
}

describe('CartStoreProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guest → member → guest 전환 시 장바구니를 섞지 않고 기존 guest 장바구니를 복원한다', async () => {
    const user = userEvent.setup();
    const view = render(<ProviderHarness ownerKey="guest" />);

    await screen.findByText('guest:empty');
    await user.click(screen.getByRole('button', { name: '상품 담기' }));
    expect(screen.getByText('guest:p1')).toBeInTheDocument();

    view.rerender(<ProviderHarness ownerKey="user:member-1" />);
    await screen.findByText('user:member-1:empty');

    view.rerender(<ProviderHarness ownerKey="guest" />);
    await screen.findByText('guest:p1');
  });

  it('기존 단일 장바구니 저장값을 최초 guest 장바구니로 복사해 복구한다', async () => {
    localStorage.setItem(
      LEGACY_CART_STORAGE_KEY,
      JSON.stringify({
        state: { items: [{ id: 'legacy-product', quantity: 2 }] },
        version: 0,
      }),
    );

    render(<ProviderHarness ownerKey="guest" />);

    await waitFor(() => {
      expect(screen.getByText('guest:legacy-product')).toBeInTheDocument();
    });
  });
});
