import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  PRODUCT_PAGE_SIZE,
  loadProductListConditions,
} from '@/features/product';
import { PRODUCTS } from '@tests/msw/fixtures';
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
