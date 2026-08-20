import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { PRODUCTS } from '@tests/msw/fixtures';
import { productListResponse } from '@tests/msw/handlers';
import { server } from '@tests/msw/server';
import { renderProductList } from '@tests/render-product-list';

const totalCountText = `총 ${PRODUCTS.length}개`;

const firstProductName = PRODUCTS[0].name;

const LIST_ERROR_MESSAGE = '상품 목록을 불러오지 못했습니다.';

const failProductList = () =>
  server.use(
    http.get('*/api/products', () =>
      HttpResponse.json({ message: LIST_ERROR_MESSAGE }, { status: 500 }),
    ),
  );

const emptyProductList = () =>
  server.use(
    http.get('*/api/products', ({ request }) =>
      HttpResponse.json({
        ...productListResponse(new URL(request.url).searchParams),
        products: [],
        totalCount: 0,
      }),
    ),
  );

const restoreProductList = () => server.resetHandlers();

describe('목록 조회', () => {
  it('조회가 끝나기 전에는 대기 화면을 보여준다', async () => {
    renderProductList();

    expect(screen.getByRole('status')).toHaveTextContent(
      '상품 목록을 불러오는 중입니다',
    );

    expect(await screen.findByText(totalCountText)).toBeInTheDocument();
  });

  it('목록이 도착하면 대기 화면을 걷어낸다', async () => {
    renderProductList();

    expect(await screen.findByText(totalCountText)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('조건에 맞는 상품이 없을 때', () => {
  it('빈 목록임을 알리는 문구를 보여준다', async () => {
    emptyProductList();

    renderProductList();

    expect(
      await screen.findByText('조건에 맞는 상품이 없습니다.'),
    ).toBeInTheDocument();
  });

  it('이동할 페이지가 없으므로 페이지 이동을 그리지 않는다', async () => {
    emptyProductList();

    renderProductList();

    await screen.findByText('조건에 맞는 상품이 없습니다.');

    expect(
      screen.queryByRole('navigation', { name: '페이지 이동' }),
    ).not.toBeInTheDocument();
  });
});

describe('목록 조회 실패', () => {
  it('보여줄 목록이 없으면 에러 화면과 빠져나갈 길을 보여준다', async () => {
    failProductList();

    renderProductList();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(LIST_ERROR_MESSAGE);
    expect(
      within(alert).getByRole('link', { name: '홈으로 가기' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(totalCountText)).not.toBeInTheDocument();
  });

  it('보여줄 목록이 있으면 목록을 유지한 채 배너로만 알린다', async () => {
    // 캐시에 심지 않고 실제 조회로 목록을 띄운 뒤에 실패시킨다
    const { queryClient } = renderProductList();

    expect(await screen.findByText(totalCountText)).toBeInTheDocument();

    // 같은 조건으로 다시 조회하다 실패하는 상황이다(창 포커스·다시 시도 등에서 일어난다)
    failProductList();
    void queryClient.refetchQueries();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('새 목록을 불러오지 못했습니다.');
    expect(screen.getByText(totalCountText)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: firstProductName }),
    ).toBeInTheDocument();
  });
});

describe('실패에서 다시 시도', () => {
  it('다시 시도하면 목록이 돌아오고 에러 화면이 사라진다', async () => {
    failProductList();

    const { user } = renderProductList();

    const alert = await screen.findByRole('alert');

    restoreProductList();
    await user.click(within(alert).getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText(totalCountText)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('목록을 유지한 채 다시 시도하면 배너만 걷힌다', async () => {
    const { user, queryClient } = renderProductList();

    expect(await screen.findByText(totalCountText)).toBeInTheDocument();

    failProductList();
    void queryClient.refetchQueries();

    const banner = await screen.findByRole('alert');

    restoreProductList();
    await user.click(within(banner).getByRole('button', { name: '다시 시도' }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByText(totalCountText)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: firstProductName }),
    ).toBeInTheDocument();
  });

  /**
   * 배너에서 확인하는 이유: 목록 없이 실패한 화면은 다시 조회하는 순간
   * isError가 내려가 대기 화면으로 바뀌므로, 그 버튼은 잠긴 모습을 볼 수 없다.
   */
  it('다시 조회하는 동안에는 다시 시도 버튼을 잠가 중복 요청을 막는다', async () => {
    const { user, queryClient } = renderProductList();

    expect(await screen.findByText(totalCountText)).toBeInTheDocument();

    failProductList();
    void queryClient.refetchQueries();

    const banner = await screen.findByRole('alert');
    const retryButton = within(banner).getByRole('button', {
      name: '다시 시도',
    });

    // 응답을 주지 않는 핸들러로 조회 중인 순간을 붙잡는다.
    // 지연 시간을 정하면 "얼마면 충분한가"라는 가정이 생겨 느린 기계에서 깨진다.
    server.use(http.get('*/api/products', () => delay('infinite')));
    await user.click(retryButton);

    expect(retryButton).toBeDisabled();
  });
});
