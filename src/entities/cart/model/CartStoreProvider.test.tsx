// @vitest-environment jsdom

import '@/test/setupDom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { LEGACY_CART_STORAGE_KEY, getCartStorageKey } from './cartOwner';
import { createCartStore } from './cartStore';
import { CartStoreProvider } from './CartStoreProvider';
import { useCartStore } from './useCartStore';
import type { CartOwnerKey } from './cartOwner';

function CartProbe() {
  const ownerKey = useCartStore((state) => state.ownerKey);
  const items = useCartStore((state) => state.items);
  const isHydrated = useCartStore((state) => state.isHydrated);
  const addItem = useCartStore((state) => state.addItem);
  const itemSummary = Array.from(items.values())
    .map((item) => `${item.id}x${item.quantity}`)
    .join(',');

  return (
    <div>
      <p>{`${ownerKey}:${isHydrated ? itemSummary || 'empty' : 'loading'}`}</p>
      <button type="button" onClick={() => addItem('p1')}>
        p1 담기
      </button>
      <button type="button" onClick={() => addItem('guest-only')}>
        guest-only 담기
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

  it('로그인하면 기존 회원 장바구니에 guest 장바구니를 합치고 guest 저장소를 비운다', async () => {
    const user = userEvent.setup();
    const memberStore = createCartStore('user:member-1');
    memberStore.getState().setHydrated();
    memberStore.getState().addItem('p1');
    memberStore.getState().addItem('p1');
    memberStore.getState().addItem('member-only');

    const view = render(<ProviderHarness ownerKey="guest" />);

    await screen.findByText('guest:empty');
    await user.click(screen.getByRole('button', { name: 'p1 담기' }));
    await user.click(screen.getByRole('button', { name: 'guest-only 담기' }));
    expect(screen.getByText('guest:p1x1,guest-onlyx1')).toBeInTheDocument();

    view.rerender(<ProviderHarness ownerKey="user:member-1" />);
    await screen.findByText(
      'user:member-1:p1x3,member-onlyx1,guest-onlyx1',
    );

    view.rerender(<ProviderHarness ownerKey="guest" />);
    await screen.findByText('guest:empty');

    view.rerender(<ProviderHarness ownerKey="user:member-1" />);
    await screen.findByText(
      'user:member-1:p1x3,member-onlyx1,guest-onlyx1',
    );
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
      expect(screen.getByText('guest:legacy-productx2')).toBeInTheDocument();
    });
  });

  it('다른 탭에서 활성 guest 저장소를 비우면 현재 장바구니도 동기화한다', async () => {
    const user = userEvent.setup();
    render(<ProviderHarness ownerKey="guest" />);

    await screen.findByText('guest:empty');
    await user.click(screen.getByRole('button', { name: 'p1 담기' }));
    expect(screen.getByText('guest:p1x1')).toBeInTheDocument();

    const memberStorageKey = getCartStorageKey('user:member-1');
    localStorage.setItem(
      memberStorageKey,
      JSON.stringify({ state: { items: [] }, version: 1 }),
    );
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: memberStorageKey,
        newValue: localStorage.getItem(memberStorageKey),
        storageArea: localStorage,
      }),
    );
    expect(screen.getByText('guest:p1x1')).toBeInTheDocument();

    const guestStorageKey = getCartStorageKey('guest');
    localStorage.setItem(
      guestStorageKey,
      JSON.stringify({ state: { items: [] }, version: 1 }),
    );
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: guestStorageKey,
        newValue: localStorage.getItem(guestStorageKey),
        storageArea: localStorage,
      }),
    );

    await screen.findByText('guest:empty');
  });
});
