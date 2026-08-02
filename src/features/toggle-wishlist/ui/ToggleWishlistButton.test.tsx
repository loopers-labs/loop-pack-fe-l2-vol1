import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToggleWishlistButton } from './ToggleWishlistButton';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';

/* AI-generated : week06-fsd.md 기준 — entities/wishlist 액션 호출과 aria-pressed 토글만 검증 (store 자체 검증은 useWishlistStore.test.ts) */
describe('ToggleWishlistButton', () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: new Set() });
  });

  it('클릭하면 해당 상품을 위시리스트 store에 추가한다', () => {
    render(<ToggleWishlistButton productId="p1" label="1번 상품" />);

    fireEvent.click(screen.getByRole('button', { name: '1번 상품 위시리스트' }));

    expect(useWishlistStore.getState().productIds.has('p1')).toBe(true);
  });

  it('이미 위시리스트에 있으면 aria-pressed가 true다', () => {
    useWishlistStore.setState({ productIds: new Set(['p1']) });

    render(<ToggleWishlistButton productId="p1" label="1번 상품" />);

    expect(
      screen.getByRole('button', { name: '1번 상품 위시리스트' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
