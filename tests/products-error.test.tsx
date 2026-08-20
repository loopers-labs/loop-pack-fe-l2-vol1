import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import { ProductList } from '@/_pages/products/ui/ProductList';
import { PRODUCTS } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';

const failProductList = () =>
  server.use(
    http.get('*/api/products', () =>
      HttpResponse.json(
        { message: '상품 목록을 불러오지 못했습니다.' },
        { status: 500 },
      ),
    ),
  );

// 성공은 기본 핸들러가 맡는다. 실패 핸들러를 걷어내면 성공 경로로 돌아간다.
const restoreProductList = () => server.resetHandlers();

const totalCountText = `총 ${PRODUCTS.length}개`;

function renderProductList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <NuqsTestingAdapter>
      <QueryClientProvider client={queryClient}>
        <ProductList />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );

  return queryClient;
}

describe('상품 목록 조회 실패 인라인 처리', () => {
  it('보여줄 데이터가 없는 실패는 에러 화면으로 처리하고 다시 시도로 복구한다', async () => {
    failProductList();

    renderProductList();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('상품 목록을 불러오지 못했습니다.');
    expect(
      within(alert).getByRole('link', { name: '홈으로 가기' }),
    ).toBeInTheDocument();

    restoreProductList();
    await userEvent.click(
      within(alert).getByRole('button', { name: '다시 시도' }),
    );

    expect(await screen.findByText(totalCountText)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('보여줄 데이터가 있는 재조회 실패는 목록을 유지한 채 배너를 띄우고 다시 시도로 복구한다', async () => {
    // 캐시에 심지 않고 실제 조회로 목록을 띄운 뒤에 실패시킨다.
    const queryClient = renderProductList();

    expect(await screen.findByText(totalCountText)).toBeInTheDocument();

    // 같은 조건으로 다시 조회하다 실패하는 상황이다(창 포커스·다시 시도 등에서 일어난다).
    failProductList();
    void queryClient.refetchQueries();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('새 목록을 불러오지 못했습니다.');
    expect(screen.getByText(totalCountText)).toBeInTheDocument();

    restoreProductList();
    await userEvent.click(
      within(alert).getByRole('button', { name: '다시 시도' }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByText(totalCountText)).toBeInTheDocument();
  });
});
