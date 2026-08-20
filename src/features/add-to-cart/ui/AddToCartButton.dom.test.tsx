import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteHeader } from '@/app/SiteHeader';
import { WishButton } from '@/features/toggle-wishlist/ui/WishButton';
import { renderWithProviders } from '@/shared/test/render';
import { AddToCartButton } from './AddToCartButton';

// 검증 대상은 "파생 구독"이다 — 담기 버튼과 헤더가 같은 스토어를 보고 있는지,
// 토글이 양방향인지. 헤더와 목록이 실제 레이아웃에서 함께 놓이는지는
// 이 조합을 테스트가 직접 만들어 주므로 여기서 확인되지 않고, E2E(1단계 15번)가 맡는다.
function CartScreen() {
  return (
    <>
      <SiteHeader />
      <AddToCartButton productId="p1" productName="첫 상품" />
      <AddToCartButton productId="p2" productName="둘째 상품" />
      <WishButton productId="p1" productName="첫 상품" />
    </>
  );
}

const header = () => screen.getByRole('banner');
const cartButton = (name: string) =>
  screen.getByRole('button', { name: `${name} 장바구니` });

describe('담기 → 헤더 개수 (1단계 12번)', () => {
  it('아무것도 담지 않았으면 헤더의 두 개수가 모두 0이다', () => {
    renderWithProviders(<CartScreen />);

    expect(header()).toHaveTextContent('장바구니 0');
    expect(header()).toHaveTextContent('위시리스트 0');
  });

  it('담으면 헤더 개수가 1이 되고 버튼이 빼기로 바뀐다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartScreen />);

    await user.click(cartButton('첫 상품'));

    expect(header()).toHaveTextContent('장바구니 1');
    expect(cartButton('첫 상품')).toHaveTextContent('빼기');
    expect(cartButton('첫 상품')).toHaveAttribute('aria-pressed', 'true');
  });

  it('담긴 상품을 다시 누르면 빠지고 개수가 0으로 돌아온다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartScreen />);

    await user.click(cartButton('첫 상품'));
    await user.click(cartButton('첫 상품'));

    expect(header()).toHaveTextContent('장바구니 0');
    expect(cartButton('첫 상품')).toHaveTextContent('담기');
    expect(cartButton('첫 상품')).toHaveAttribute('aria-pressed', 'false');
  });

  it('여러 상품을 담으면 개수가 쌓이고, 하나만 빼면 나머지는 남는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartScreen />);

    await user.click(cartButton('첫 상품'));
    await user.click(cartButton('둘째 상품'));
    expect(header()).toHaveTextContent('장바구니 2');

    await user.click(cartButton('첫 상품'));

    expect(header()).toHaveTextContent('장바구니 1');
    expect(cartButton('둘째 상품')).toHaveAttribute('aria-pressed', 'true');
  });

  it('찜은 위시리스트 개수만 올리고 장바구니 개수는 건드리지 않는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartScreen />);

    await user.click(
      screen.getByRole('button', { name: '첫 상품 위시리스트' }),
    );

    expect(header()).toHaveTextContent('위시리스트 1');
    expect(header()).toHaveTextContent('장바구니 0');
  });

  it('앞선 테스트에서 담은 것이 다음 테스트로 넘어오지 않는다', () => {
    renderWithProviders(<CartScreen />);

    expect(header()).toHaveTextContent('장바구니 0');
    expect(header()).toHaveTextContent('위시리스트 0');
  });
});
