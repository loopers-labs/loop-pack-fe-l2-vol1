import { ProductListPage } from '@/_pages/product-list/ui/ProductListPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Header } from './Header';

/**
 * 검증 항목 12 — 담기 → 헤더 개수 · 다시 누르면 빠짐 (통합)
 *
 * 목록의 버튼과 헤더는 서로를 모르고 store 로만 이어져 있다. 그 연결은 **두 컴포넌트를
 * 함께 렌더해야** 드러난다. 항목 1(단위)이 파생 규칙을 잡는다면 여기서는 배선을 잡는다 —
 * store 가 옳게 동작해도 헤더가 다른 selector 를 구독하면 숫자가 안 움직인다.
 */
const cardOf = async (productName: string) => {
  const heading = await screen.findByRole('heading', { name: productName });
  const card = heading.closest('article');

  if (card === null) throw new Error(`${productName} 카드를 찾지 못했습니다.`);

  return within(card);
};

const header = () => within(screen.getByRole('banner'));

const renderListWithHeader = () =>
  renderWithProviders(
    <>
      <Header />
      <ProductListPage />
    </>,
  );

describe('헤더 개수와 목록 담기', () => {
  it('상품을 담으면 헤더 장바구니 개수가 1 늘고 버튼이 담김 상태가 된다', async () => {
    const user = userEvent.setup();
    renderListWithHeader();

    expect(header().getByText('장바구니 0')).toBeInTheDocument();

    const card = await cardOf('기본 티셔츠');
    await user.click(card.getByRole('button', { name: '기본 티셔츠 장바구니' }));

    expect(header().getByText('장바구니 1')).toBeInTheDocument();
    expect(card.getByRole('button', { name: '기본 티셔츠 장바구니' })).toHaveAttribute('aria-pressed', 'true');
    expect(card.getByRole('button', { name: '기본 티셔츠 장바구니' })).toHaveTextContent('담김');
  });

  it('담은 상품을 다시 누르면 헤더 개수가 0으로 돌아간다', async () => {
    const user = userEvent.setup();
    renderListWithHeader();

    const card = await cardOf('기본 티셔츠');
    const button = card.getByRole('button', { name: '기본 티셔츠 장바구니' });

    await user.click(button);
    expect(header().getByText('장바구니 1')).toBeInTheDocument();

    await user.click(button);

    expect(header().getByText('장바구니 0')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  // 경계 — 서로 다른 두 상품을 담으면 개수가 2가 되어야 한다
  it('서로 다른 두 상품을 담으면 헤더 개수가 2가 된다', async () => {
    const user = userEvent.setup();
    renderListWithHeader();

    const first = await cardOf('기본 티셔츠');
    const second = await cardOf('데일리 스니커즈');

    await user.click(first.getByRole('button', { name: '기본 티셔츠 장바구니' }));
    await user.click(second.getByRole('button', { name: '데일리 스니커즈 장바구니' }));

    expect(header().getByText('장바구니 2')).toBeInTheDocument();
  });

  // 경계 — 장바구니와 위시리스트는 별개 store 라 서로를 건드리면 안 된다
  it('위시리스트에 찜해도 장바구니 개수는 0으로 남는다', async () => {
    const user = userEvent.setup();
    renderListWithHeader();

    const card = await cardOf('기본 티셔츠');
    await user.click(card.getByRole('button', { name: '기본 티셔츠 위시리스트' }));

    expect(header().getByText('위시리스트 1')).toBeInTheDocument();
    expect(header().getByText('장바구니 0')).toBeInTheDocument();
  });
});
