import { QueryClient } from '@tanstack/react-query';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HomeContent } from '@/_pages/home/ui/HomeContent';
import { productQueries } from '@/entities/product';
import { HOME_RESPONSE } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';
import { renderWithProviders } from '@tests/render-with-providers';

const failHome = () =>
  server.use(
    http.get('*/api/home', () =>
      HttpResponse.json(
        { message: '홈 데이터를 불러오지 못했습니다.' },
        { status: 500 },
      ),
    ),
  );

function renderHome(queryClient: QueryClient) {
  renderWithProviders(<HomeContent />, { queryClient });
}

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('홈 조회 실패 인라인 처리', () => {
  it('보여줄 데이터가 없는 실패는 콘텐츠 영역 에러 화면으로 처리한다', async () => {
    failHome();

    renderHome(createTestQueryClient());

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('홈 데이터를 불러오지 못했습니다.');
    expect(
      within(alert).getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
  });

  it('보여줄 데이터가 있는 재조회 실패는 화면을 유지하고 배너를 띄운다', async () => {
    failHome();

    const queryClient = createTestQueryClient();

    queryClient.setQueryData(productQueries.home().queryKey, HOME_RESPONSE);
    renderHome(queryClient);

    expect(
      screen.getByRole('heading', { name: '인기 상품' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    void queryClient.refetchQueries({
      queryKey: productQueries.home().queryKey,
    });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('새 내용을 불러오지 못했습니다.');
    expect(
      within(alert).getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '인기 상품' }),
    ).toBeInTheDocument();
  });
});
