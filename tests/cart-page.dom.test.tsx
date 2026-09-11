import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CartPage } from '@/_pages/cart';
import {
  CART_STORAGE_KEY,
  useCartStore,
  type CartItem,
} from '@/entities/cart/model/cart-store';
import {
  CHECKOUT_STORAGE_KEY,
  useCheckoutStore,
} from '@/entities/order/model/checkout-store';
import { PRODUCTS, SESSION_USER } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';
import { renderWithProviders } from '@tests/render-with-providers';

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeAll(async () => {
  await useCartStore.persist.rehydrate();
  await useCheckoutStore.persist.rehydrate();
});

afterEach(() => {
  vi.clearAllMocks();
});

const seedCart = (...productIds: string[]) =>
  useCartStore.setState({
    items: productIds.map((productId) => ({
      productId,
      quantity: 1,
      checked: false,
    })),
  });

const seedCartItems = (...items: CartItem[]) =>
  useCartStore.setState({ items });

const renderCartPage = (initialUser: typeof SESSION_USER | null = null) =>
  renderWithProviders(<CartPage />, { initialUser });

const draftItems = () => useCheckoutStore.getState().draftItems;

const productAt = (index: number) => {
  const product = PRODUCTS.at(index);

  if (!product) throw new Error(`픽스처에 ${index}번째 상품이 없다`);

  return product;
};

describe('비로그인 구매', () => {
  it('구매하기를 누르면 선택 상품·수량이 draft로 확정되고 로그인 안내가 열린다', async () => {
    const firstProduct = productAt(0);
    const secondProduct = productAt(1);
    const thirdProduct = productAt(2);

    seedCartItems(
      { productId: firstProduct.id, quantity: 2, checked: false },
      { productId: secondProduct.id, quantity: 1, checked: false },
      { productId: thirdProduct.id, quantity: 1, checked: false },
    );
    const { user } = renderCartPage();
    const purchaseButton = screen.getByRole('button', { name: /구매하기/ });

    await screen.findByText(firstProduct.name);
    expect(purchaseButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: firstProduct.name }));
    await user.click(screen.getByRole('checkbox', { name: thirdProduct.name }));
    expect(purchaseButton).toBeEnabled();
    await user.click(purchaseButton);

    expect(draftItems()).toEqual([
      { productId: firstProduct.id, quantity: 2 },
      { productId: thirdProduct.id, quantity: 1 },
    ]);

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByRole('link', { name: '로그인 페이지로 이동' }),
    ).toHaveAttribute('href', '/login?next=%2Forders%2Fnew&from=cart');

    await user.click(within(dialog).getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: firstProduct.name }),
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: thirdProduct.name }),
    ).toBeChecked();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('draft는 확정 시점의 스냅샷이라 이후 장바구니 수량 변경을 따라가지 않는다', async () => {
    const product = productAt(0);

    seedCartItems({ productId: product.id, quantity: 2, checked: false });
    const { user } = renderCartPage();

    await screen.findByText(product.name);
    await user.click(screen.getByRole('checkbox', { name: product.name }));
    await user.click(screen.getByRole('button', { name: /구매하기/ }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: '닫기',
      }),
    );

    await user.click(
      screen.getByRole('button', { name: `${product.name} 수량 늘리기` }),
    );

    expect(
      screen.getByRole('spinbutton', { name: `${product.name} 수량` }),
    ).toHaveValue(3);
    // 다시 구매하기를 누르기 전까지 draft는 확정 당시의 수량 2를 유지한다
    expect(draftItems()).toEqual([{ productId: product.id, quantity: 2 }]);
  });
});

describe('로그인 구매', () => {
  it('구매하기를 누르면 draft를 확정하고 상품 ID 없는 URL로 주문서에 간다', async () => {
    const firstProduct = productAt(0);
    const secondProduct = productAt(1);

    seedCart(firstProduct.id, secondProduct.id);
    const { user } = renderCartPage(SESSION_USER);

    await screen.findByText(firstProduct.name);
    await user.click(screen.getByRole('checkbox', { name: firstProduct.name }));
    await user.click(screen.getByRole('button', { name: /구매하기/ }));

    expect(draftItems()).toEqual([{ productId: firstProduct.id, quantity: 1 }]);
    expect(router.push).toHaveBeenCalledWith('/orders/new');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // draft는 sessionStorage에 남아 주문서 새로고침에도 살아남는다
    expect(
      JSON.parse(sessionStorage.getItem(CHECKOUT_STORAGE_KEY) ?? 'null'),
    ).toMatchObject({
      state: { draftItems: [{ productId: firstProduct.id, quantity: 1 }] },
    });
  });
});

describe('장바구니 목록', () => {
  it('장바구니가 비어 있으면 빈 상태와 상품 목록 CTA를 보여준다', () => {
    seedCart();
    renderCartPage();

    expect(screen.getByText('장바구니가 비어 있습니다.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '상품 보러 가기' }),
    ).toHaveAttribute('href', '/products');
  });

  it('수량을 늘리고 줄일 수 있으며 1 아래로는 줄일 수 없다', async () => {
    const product = productAt(0);

    seedCart(product.id);
    const { user } = renderCartPage();

    await screen.findByText(product.name);
    await user.click(
      screen.getByRole('button', { name: `${product.name} 수량 늘리기` }),
    );

    expect(
      screen.getByRole('spinbutton', { name: `${product.name} 수량` }),
    ).toHaveValue(2);

    const decrease = screen.getByRole('button', {
      name: `${product.name} 수량 줄이기`,
    });

    await user.click(decrease);

    expect(
      screen.getByRole('spinbutton', { name: `${product.name} 수량` }),
    ).toHaveValue(1);
    expect(decrease).toBeDisabled();
  });

  it('삭제를 누르면 그 상품만 장바구니에서 빠진다', async () => {
    const firstProduct = productAt(0);
    const secondProduct = productAt(1);

    seedCart(firstProduct.id, secondProduct.id);
    const { user } = renderCartPage();

    await screen.findByText(firstProduct.name);
    await user.click(
      screen.getByRole('button', { name: `${firstProduct.name} 삭제` }),
    );

    expect(
      screen.queryByRole('checkbox', { name: firstProduct.name }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: secondProduct.name }),
    ).toBeInTheDocument();
  });
});

describe('상품 정보', () => {
  it('뒷페이지 상품을 포함해 담긴 모든 상품의 이름과 가격을 표시한다', async () => {
    const firstPageProduct = productAt(0);
    const secondPageProduct = productAt(PRODUCTS.length - 1);

    seedCart(firstPageProduct.id, secondPageProduct.id);
    renderCartPage();

    expect(await screen.findByText(firstPageProduct.name)).toBeInTheDocument();
    expect(screen.getByText(secondPageProduct.name)).toBeInTheDocument();
    expect(
      screen.getByText(`${firstPageProduct.price.toLocaleString()}원`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${secondPageProduct.price.toLocaleString()}원`),
    ).toBeInTheDocument();
  });

  it('선택된 상품 기준으로 주문 예상 금액과 구매 버튼 개수를 보여준다', async () => {
    const [firstProduct, secondProduct] = [productAt(0), productAt(1)];

    seedCartItems(
      { productId: firstProduct.id, quantity: 2, checked: true },
      { productId: secondProduct.id, quantity: 1, checked: true },
    );
    renderCartPage();

    const expectedTotal = firstProduct.price * 2 + secondProduct.price;
    const summary = screen.getByRole('complementary', {
      name: '주문 예상 금액',
    });

    // 총 상품 가격과 합계 두 줄이 같은 금액을 보여준다
    await waitFor(() => {
      expect(
        within(summary).getAllByText(`${expectedTotal.toLocaleString()}원`),
      ).toHaveLength(2);
    });
    expect(
      within(summary).getByRole('button', { name: '총 2개 상품 구매하기' }),
    ).toBeInTheDocument();
  });

  it('상품 정보 조회가 실패해도 목록은 남고, 다시 시도로 복구한다', async () => {
    const product = productAt(0);

    server.use(
      http.get(
        '*/api/products',
        () =>
          HttpResponse.json(
            { message: '상품 정보를 불러오지 못했습니다.' },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    seedCartItems({ productId: product.id, quantity: 1, checked: true });
    const { user } = renderCartPage();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('상품 정보를 불러오지 못했습니다.');
    // 장바구니는 브라우저 원본이라 상품 정보 없이도 ID로 확인·조작할 수 있다
    expect(
      screen.getByRole('checkbox', { name: product.id }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('계산 불가')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /구매하기/ })).toBeDisabled();

    await user.click(within(alert).getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText(product.name)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /구매하기/ })).toBeEnabled();
  });

  it('세션 확인 실패 중에는 구매를 막고 재조회로 비로그인이 확인되면 로그인 안내를 연다', async () => {
    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json(
          { message: '세션을 확인하지 못했습니다.' },
          { status: 500 },
        ),
      ),
    );
    seedCartItems({ productId: productAt(0).id, quantity: 1, checked: true });
    // 서버 hydration이 없던 상황이라 화면이 /me를 직접 조회하고 실패를 만난다
    const { user } = renderWithProviders(<CartPage />, {
      seedSessionUser: false,
    });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('로그인 상태를 확인하지 못했습니다.');

    await screen.findByText(productAt(0).name);
    const purchaseButton = screen.getByRole('button', { name: /구매하기/ });

    expect(purchaseButton).toBeDisabled();

    await user.click(purchaseButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(draftItems()).toEqual([]);

    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
      ),
    );
    await user.click(within(alert).getByRole('button', { name: '다시 시도' }));

    await waitFor(() => {
      expect(purchaseButton).toBeEnabled();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(purchaseButton);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});

describe('전체 선택', () => {
  it('전체 선택을 누르면 모든 상품이 선택되고, 다시 누르면 모두 해제된다', async () => {
    const firstProduct = productAt(0);
    const secondProduct = productAt(1);

    seedCartItems(
      { productId: firstProduct.id, quantity: 1, checked: true },
      { productId: secondProduct.id, quantity: 1, checked: false },
    );
    const { user } = renderCartPage();

    const firstItemCheckbox = await screen.findByRole('checkbox', {
      name: firstProduct.name,
    });
    const selectAll = screen.getByRole('checkbox', { name: '전체 선택' });
    expect(selectAll).not.toBeChecked();

    await user.click(selectAll);

    expect(selectAll).toBeChecked();
    expect(firstItemCheckbox).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: secondProduct.name }),
    ).toBeChecked();

    await user.click(selectAll);

    expect(firstItemCheckbox).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: secondProduct.name }),
    ).not.toBeChecked();
    expect(screen.getByRole('button', { name: '구매하기' })).toBeDisabled();
  });
});

describe('수량 직접 입력', () => {
  it('지우고 12를 입력하면 즉시 합계·저장에 반영되고 바로 구매한 draft도 12다', async () => {
    const product = productAt(0);

    seedCartItems({ productId: product.id, quantity: 1, checked: true });
    const { user } = renderCartPage(SESSION_USER);
    const input = await screen.findByRole('spinbutton', {
      name: `${product.name} 수량`,
    });

    await user.clear(input);
    expect(input).toHaveValue(null);
    await user.type(input, '12');

    expect(input).toHaveFocus();
    expect(input).toHaveValue(12);
    const summary = screen.getByRole('complementary', {
      name: '주문 예상 금액',
    });
    expect(
      within(summary).getAllByText(
        `${(product.price * 12).toLocaleString()}원`,
      ),
    ).toHaveLength(2);
    expect(
      JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null'),
    ).toMatchObject({
      state: {
        items: [{ productId: product.id, quantity: 12, checked: true }],
      },
    });

    await user.click(screen.getByRole('button', { name: /구매하기/ }));

    expect(draftItems()).toEqual([{ productId: product.id, quantity: 12 }]);
    expect(router.push).toHaveBeenCalledWith('/orders/new');

    await user.click(
      screen.getByRole('button', { name: `${product.name} 수량 늘리기` }),
    );
    expect(input).toHaveValue(13);
    await user.click(
      screen.getByRole('button', { name: `${product.name} 수량 줄이기` }),
    );
    expect(input).toHaveValue(12);
  });

  it.each(['', '0', '-3', '1.5', '9007199254740992'])(
    '유효하지 않은 입력 "%s"는 저장하지 않고 포커스를 옮기면 마지막 수량으로 복원한다',
    async (invalidInput) => {
      const product = productAt(0);

      seedCartItems({ productId: product.id, quantity: 3, checked: true });
      const { user } = renderCartPage();
      const input = await screen.findByRole('spinbutton', {
        name: `${product.name} 수량`,
      });

      await user.clear(input);
      await user.paste(invalidInput);

      expect(
        JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null'),
      ).toMatchObject({
        state: {
          items: [{ productId: product.id, quantity: 3, checked: true }],
        },
      });
      await user.tab();
      expect(input).toHaveValue(3);
    },
  );

  it('빈칸에서 Enter를 누르면 직전에 직접 입력한 유효 수량으로 복원한다', async () => {
    const product = productAt(0);

    seedCart(product.id);
    const { user } = renderCartPage();
    const input = await screen.findByRole('spinbutton', {
      name: `${product.name} 수량`,
    });

    await user.clear(input);
    await user.paste('12');
    await user.clear(input);
    await user.keyboard('{Enter}');

    expect(input).toHaveValue(12);
    expect(input).not.toHaveFocus();
  });
});
