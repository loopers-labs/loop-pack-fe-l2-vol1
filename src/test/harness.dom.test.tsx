import { ProductListPage } from '@/_pages/product-list/ui/ProductListPage';
import { Header } from '@/widgets/header';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from './renderWithProviders';

/**
 * 0단계 하네스 스모크.
 *
 * 15개 검증 항목은 여기 없다. 이 파일이 증명하는 것은 **하네스가 실제로 돌아간다**는 사실
 * 하나뿐이다: jsdom 프로젝트가 뜨고, apiClient 의 상대경로 요청이 MSW 에 잡히고,
 * 테스트용 QueryClient 와 nuqs 테스트 어댑터가 앱 컴포넌트를 렌더한다.
 * 2단계에서 실제 검증 테스트가 들어오면 이 파일은 그대로 두고 옆에 쌓는다.
 */
describe('테스트 하네스', () => {
  it('MSW 가 가로챈 목록 응답으로 상품 카드를 그린다', async () => {
    renderWithProviders(<ProductListPage />);

    // 첫 대기만 비동기로 한다. 나머지는 동기로 확인한다.
    expect(await screen.findByRole('heading', { name: '기본 티셔츠' })).toBeInTheDocument();

    const results = screen.getByRole('region', { name: '상품 검색 결과' });
    expect(within(results).getByText('총 3개')).toBeInTheDocument();
    expect(within(results).getByRole('heading', { name: '데일리 스니커즈' })).toBeInTheDocument();
  });

  it('진입 URL 의 검색 조건이 필터 폼의 초기값으로 복원된다', async () => {
    renderWithProviders(<ProductListPage />, { searchParams: '?q=셔츠&category=fashion' });

    expect(await screen.findByRole('heading', { name: '기본 티셔츠' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '검색' })).toHaveValue('셔츠');
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveValue('fashion');
  });

  it('장바구니에 담으면 헤더 개수가 함께 올라간다', async () => {
    const { user } = await import('@testing-library/user-event').then((m) => ({ user: m.default.setup() }));

    renderWithProviders(
      <>
        <Header />
        <ProductListPage />
      </>,
    );

    const card = (await screen.findByRole('heading', { name: '기본 티셔츠' })).closest('article');
    expect(card).not.toBeNull();

    await user.click(within(card as HTMLElement).getByRole('button', { name: '기본 티셔츠 장바구니' }));

    expect(screen.getByText('장바구니 1')).toBeInTheDocument();
  });
});
