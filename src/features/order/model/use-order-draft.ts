'use client';

import { useQuery } from '@tanstack/react-query';

import { useCheckoutDraft, type CheckoutDraftItem } from '@/entities/order';
import { productQueries, type Product } from '@/entities/product';

export type OrderDraftProduct = CheckoutDraftItem & { product: Product };

type OrderDraft =
  | { status: 'restoring' }
  | { status: 'loading' }
  | { status: 'error'; retryCatalog: () => void }
  | { status: 'empty' }
  | {
      status: 'ready';
      orderProducts: OrderDraftProduct[];
      totalPrice: number;
    };

/**
 * 주문서가 읽는 유일한 화면 모델. checkout draft를 catalog와 대조해
 * 판매 중인 상품만 남기고 draft 수량과 최신 가격으로 합계를 만든다.
 * 주문서는 cart store를 읽지 않는다.
 */
export function useOrderDraft(): OrderDraft {
  const draftItems = useCheckoutDraft(
    (checkoutDraft) => checkoutDraft.draftItems,
  );
  const {
    data: catalogProducts,
    isPending,
    isError,
    refetch,
  } = useQuery({
    ...productQueries.catalog(),
    // 주문할 상품이 없으면 붙일 정보도 없다. 전체 페이지 조회라 요청 자체를 막는다.
    enabled: Boolean(draftItems?.length),
  });

  if (!draftItems) return { status: 'restoring' };

  if (draftItems.length === 0) return { status: 'empty' };

  if (isError) {
    return {
      status: 'error',
      retryCatalog: () => {
        void refetch();
      },
    };
  }

  if (isPending) return { status: 'loading' };

  const productById = new Map(
    catalogProducts.map((product) => [product.id, product]),
  );
  const orderProducts = draftItems.flatMap((item) => {
    const product = productById.get(item.productId);

    return product ? [{ ...item, product }] : [];
  });

  if (orderProducts.length === 0) return { status: 'empty' };

  return {
    status: 'ready',
    orderProducts,
    totalPrice: orderProducts.reduce(
      (sum, { quantity, product }) => sum + quantity * product.price,
      0,
    ),
  };
}
