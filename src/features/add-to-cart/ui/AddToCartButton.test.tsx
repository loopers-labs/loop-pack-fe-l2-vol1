import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddToCartButton } from './AddToCartButton';
import { useCartStore } from '@/entities/cart/model/useCartStore';

/* AI-generated : week06-fsd.md 기준 — entities/cart 액션 호출과 aria-pressed 토글만 검증 (store 자체 검증은 useCartStore.test.ts) */
describe('AddToCartButton', () => {
  beforeEach(() => {
    useCartStore.setState({ productIds: new Set() });
  });

  it('클릭하면 해당 상품을 장바구니 store에 추가한다', () => {
    render(<AddToCartButton productId="p1" label="1번 상품" />);

    fireEvent.click(screen.getByRole('button', { name: '1번 상품 담기' }));

    expect(useCartStore.getState().productIds.has('p1')).toBe(true);
  });

  it('이미 장바구니에 있으면 aria-pressed가 true다', () => {
    useCartStore.setState({ productIds: new Set(['p1']) });

    render(<AddToCartButton productId="p1" label="1번 상품" />);

    expect(screen.getByRole('button', { name: '1번 상품 담기' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});
