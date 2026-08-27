import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  PRODUCT_PAGE_SIZE,
  loadProductListConditions,
} from '@/features/product';
import { PRODUCTS } from '@tests/msw/fixtures';
import { productListResponse } from '@tests/msw/handlers';
import { server } from '@tests/msw/server';
import { renderProductList } from '@tests/render-product-list';

const homeProducts = PRODUCTS.filter((product) => product.category === 'home');

const otherProducts = PRODUCTS.filter((product) => product.category !== 'home');

const cheapestProduct = [...PRODUCTS].sort((a, b) => a.price - b.price)[0];

const secondPageFirstProduct = PRODUCTS[PRODUCT_PAGE_SIZE];

const totalPages = Math.ceil(PRODUCTS.length / PRODUCT_PAGE_SIZE);

const homeTotalPages = Math.ceil(homeProducts.length / PRODUCT_PAGE_SIZE);

const totalCountText = (count: number) => `총 ${count}개`;

const pageText = (page: number, pages: number) => `${page} / ${pages}`;

const filter = (name: string) => screen.getByRole('combobox', { name });

const option = (name: string) => screen.getByRole('option', { name });

const productHeading = (name: string) => screen.getByRole('heading', { name });

describe('카테고리 변경', () => {
  it('카테고리를 바꾸면 그 카테고리 상품으로 목록이 갈아탄다', async () => {
    const { user } = renderProductList();

    expect(
      await screen.findByText(totalCountText(PRODUCTS.length)),
    ).toBeInTheDocument();
    expect(productHeading(otherProducts[0].name)).toBeInTheDocument();

    await user.selectOptions(filter('카테고리'), option('홈'));

    expect(
      await screen.findByText(totalCountText(homeProducts.length)),
    ).toBeInTheDocument();
    expect(productHeading(homeProducts[0].name)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: otherProducts[0].name }),
    ).not.toBeInTheDocument();
  });

  it('새 목록이 올 때까지 이전 목록을 유지하고, 도착하면 새 목록으로 바꾼다', async () => {
    const { user } = renderProductList();

    expect(
      await screen.findByText(totalCountText(PRODUCTS.length)),
    ).toBeInTheDocument();

    // 응답을 붙들어 조회 중인 순간을 붙잡고, 테스트가 허락한 시점에 기본 응답을 그대로 보낸다
    const { promise: released, resolve: release } =
      Promise.withResolvers<void>();

    server.use(
      http.get('*/api/products', async ({ request }) => {
        await released;

        return HttpResponse.json(
          productListResponse(new URL(request.url).searchParams),
        );
      }),
    );
    await user.selectOptions(filter('카테고리'), option('홈'));

    expect(filter('카테고리')).toHaveValue('home');
    expect(
      screen.getByText(totalCountText(PRODUCTS.length)),
    ).toBeInTheDocument();
    expect(productHeading(otherProducts[0].name)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    release();

    expect(
      await screen.findByText(totalCountText(homeProducts.length)),
    ).toBeInTheDocument();
    expect(productHeading(homeProducts[0].name)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: otherProducts[0].name }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('첫 페이지가 아닌 곳에서 카테고리를 바꾸면 1페이지부터 다시 보여준다', async () => {
    const { user } = renderProductList('?page=2');

    expect(
      await screen.findByText(pageText(2, totalPages)),
    ).toBeInTheDocument();

    await user.selectOptions(filter('카테고리'), option('홈'));

    expect(
      await screen.findByText(pageText(1, homeTotalPages)),
    ).toBeInTheDocument();
  });
});

describe('정렬 변경', () => {
  it('낮은 가격순으로 바꾸면 가장 싼 상품이 맨 앞에 온다', async () => {
    const { user } = renderProductList();

    expect(
      await screen.findByRole('heading', { name: PRODUCTS[0].name }),
    ).toBeInTheDocument();

    await user.selectOptions(filter('정렬'), option('낮은 가격순'));

    expect(
      await screen.findByRole('heading', { name: cheapestProduct.name }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent(
      cheapestProduct.name,
    );
  });

  it('첫 페이지가 아닌 곳에서 정렬을 바꾸면 1페이지부터 다시 보여준다', async () => {
    const { user } = renderProductList('?page=2');

    expect(
      await screen.findByText(pageText(2, totalPages)),
    ).toBeInTheDocument();

    await user.selectOptions(filter('정렬'), option('낮은 가격순'));

    expect(
      await screen.findByText(pageText(1, totalPages)),
    ).toBeInTheDocument();
  });
});

describe('페이지 이동', () => {
  it('다음을 누르면 다음 페이지 상품과 번호로 바뀐다', async () => {
    const { user } = renderProductList();

    expect(
      await screen.findByText(pageText(1, totalPages)),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(
      await screen.findByText(pageText(2, totalPages)),
    ).toBeInTheDocument();
    expect(productHeading(secondPageFirstProduct.name)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: PRODUCTS[0].name }),
    ).not.toBeInTheDocument();
  });

  it('첫 페이지에서는 이전으로 갈 수 없다', async () => {
    renderProductList();

    await screen.findByText(pageText(1, totalPages));

    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('마지막 페이지에서는 다음으로 갈 수 없다', async () => {
    renderProductList(`?page=${totalPages}`);

    await screen.findByText(pageText(totalPages, totalPages));

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '이전' })).toBeEnabled();
  });

  it('이전 목록을 보여주는 동안에는 페이지 보정이 끼어들지 않는다', async () => {
    // gcTime 0: 떠난 조건의 캐시가 바로 사라져, 돌아올 때 이전 목록을 보여주며 다시 받아온다
    const { user, onUrlUpdate, navigate } = renderProductList('?page=2', {
      gcTime: 0,
    });

    await screen.findByText(pageText(2, totalPages));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await screen.findByText(pageText(3, totalPages));

    await user.selectOptions(filter('카테고리'), option('홈'));
    await screen.findByText(pageText(1, homeTotalPages));

    navigate('?page=3');

    expect(
      await screen.findByText(pageText(3, totalPages)),
    ).toBeInTheDocument();
    // URL 쓰기는 다음·홈 두 번뿐이어야 한다. 보정이 끼어들었다면 홈의 마지막 페이지로 한 번 더 썼다
    expect(onUrlUpdate).toHaveBeenCalledTimes(2);
  });

  it('마지막 페이지를 넘긴 주소로 들어오면 이동 중임을 알린 뒤 마지막 페이지로 보정한다', async () => {
    const { onUrlUpdate } = renderProductList('?page=99999');

    // 보정 effect가 즉시 URL을 고쳐 이 화면은 한 렌더만 존재한다.
    // findBy가 돌아올 땐 이미 사라져 toBeInTheDocument는 쓸 수 없고, 나타난 사실이 단언이다.
    await screen.findByText('올바른 페이지로 이동 중입니다.');

    expect(
      await screen.findByText(pageText(totalPages, totalPages)),
    ).toBeInTheDocument();
    expect(onUrlUpdate).toHaveBeenCalledOnce();
    expect(
      loadProductListConditions(onUrlUpdate.mock.calls[0][0].searchParams),
    ).toMatchObject({ page: totalPages });
  });
});

describe('조작이 URL에 쓰인다', () => {
  const writtenConditions = async (
    onUrlUpdate: ReturnType<typeof renderProductList>['onUrlUpdate'],
  ) => {
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledOnce());

    return loadProductListConditions(onUrlUpdate.mock.calls[0][0].searchParams);
  };

  it('카테고리를 바꾸면 category에 그 값이 실리고 page는 1로 돌아간다', async () => {
    const { user, onUrlUpdate } = renderProductList('?page=2');

    await user.selectOptions(filter('카테고리'), option('홈'));

    expect(await writtenConditions(onUrlUpdate)).toMatchObject({
      category: 'home',
      page: 1,
    });
  });

  it('정렬을 바꾸면 sort에 그 값이 실리고 page는 1로 돌아간다', async () => {
    const { user, onUrlUpdate } = renderProductList('?page=2');

    await user.selectOptions(filter('정렬'), option('낮은 가격순'));

    expect(await writtenConditions(onUrlUpdate)).toMatchObject({
      sort: 'price-asc',
      page: 1,
    });
  });

  it('다음을 누르면 page에 다음 번호가 실린다', async () => {
    const { user, onUrlUpdate } = renderProductList();

    await screen.findByText(pageText(1, totalPages));
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(await writtenConditions(onUrlUpdate)).toMatchObject({ page: 2 });
  });
});
