import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MyPage } from '@/_pages/my';
import { SESSION_USER } from '@tests/msw/fixtures';
import { renderWithProviders } from '@tests/render-with-providers';

describe('마이페이지', () => {
  it('비로그인이면 로그인 안내·CTA와 마이 메뉴 진입점을 보여준다', () => {
    renderWithProviders(<MyPage />, { initialUser: null });

    expect(
      screen.getByText(
        '로그인하면 주문 내역과 계정 정보를 확인할 수 있습니다.',
      ),
    ).toBeInTheDocument();
    // 공통 로그인 URL 규칙: 로그인 후 /my로 돌아온다
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute(
      'href',
      '/login?next=%2Fmy',
    );

    const menu = screen.getByRole('navigation', { name: '마이 메뉴' });

    expect(
      within(menu).getByRole('link', { name: '장바구니' }),
    ).toHaveAttribute('href', '/cart');
    expect(
      within(menu).getByRole('link', { name: /주문 내역/ }),
    ).toHaveAttribute('href', '/orders');
    expect(within(menu).getByText('로그인 필요')).toBeInTheDocument();
    expect(screen.queryByText(SESSION_USER.email)).not.toBeInTheDocument();
  });

  it('로그인 상태면 이름·이메일과 주문 내역 진입점을 보여준다', () => {
    renderWithProviders(<MyPage />, { initialUser: SESSION_USER });

    expect(screen.getByText(SESSION_USER.name)).toBeInTheDocument();
    expect(screen.getByText(SESSION_USER.email)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '주문 내역' })).toHaveAttribute(
      'href',
      '/orders',
    );
    expect(
      screen.queryByRole('link', { name: '로그인' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('로그인 필요')).not.toBeInTheDocument();
  });
});
