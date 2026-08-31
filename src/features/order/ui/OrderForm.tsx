'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { OrderDraftProduct } from '../model/use-order-draft';

import styles from './OrderForm.module.css';

import { useCartActions } from '@/entities/cart';
import {
  createOrder,
  orderQueries,
  useCheckoutActions,
} from '@/entities/order';

export function OrderForm({
  orderProducts,
  totalPrice,
}: {
  orderProducts: OrderDraftProduct[];
  totalPrice: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { removeItems } = useCartActions();
  const { clearCheckoutDraft } = useCheckoutActions();

  const { mutate, isPending, error } = useMutation({
    mutationFn: createOrder,
    onSuccess: (_, request) => {
      // 주문된 상품만 장바구니에서 빼고, draft와 주문 캐시를 정리한 뒤 내역으로 이동한다
      removeItems(request.items.map((item) => item.productId));
      clearCheckoutDraft();
      void queryClient.invalidateQueries({ queryKey: orderQueries.all() });
      router.replace('/orders');
    },
  });

  const handleOrderClick = () => {
    mutate({
      items: orderProducts.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
    });
  };

  return (
    <div className={styles.layout}>
      <section
        className={styles.products}
        aria-labelledby="order-products-title"
      >
        <h2 id="order-products-title" className={styles.productsTitle}>
          주문 상품 {orderProducts.length}개
        </h2>
        <ul className={styles.list}>
          {orderProducts.map(({ productId, quantity, product }) => (
            <li key={productId} className={styles.row}>
              <Image
                className={styles.thumbnail}
                src={product.image}
                alt=""
                width={72}
                height={72}
              />
              <span className={styles.info}>
                <span className={styles.name}>{product.name}</span>
                <span className={styles.meta}>{quantity}개</span>
              </span>
              <strong className={styles.linePrice}>
                {(product.price * quantity).toLocaleString()}원
              </strong>
            </li>
          ))}
        </ul>
      </section>

      <aside className={styles.summary} aria-labelledby="order-summary-title">
        <h2 id="order-summary-title" className={styles.summaryTitle}>
          결제 금액
        </h2>
        <p className={styles.summaryTotal}>
          <span>총 결제 금액</span>
          <strong>{totalPrice.toLocaleString()}원</strong>
        </p>
        {error && <p role="alert">{error.message}</p>}
        <button
          type="button"
          className={styles.orderButton}
          disabled={isPending}
          onClick={handleOrderClick}
        >
          주문하기
        </button>
      </aside>
    </div>
  );
}
