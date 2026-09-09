'use client';

import Link from 'next/link';
import { Header } from '@/widgets/header/ui/Header';
import { PageHeading } from '@/shared/ui/PageHeading/PageHeading';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { useCartHydrated } from '@/entities/cart/model/useCartHydrated';
import { useCreateOrderMutation } from '@/features/create-order/api/useCreateOrderMutation';
import { useScreenViewOnce } from '@/analytics/useScreenViewOnce';
import { trackOrderStart } from '@/analytics/trackEvents';

/** 담기는 담았는지 여부만 기록하므로 수량은 1로 본다 */
const DEFAULT_QUANTITY = 1;

export function OrderFormView() {
  const productIds = useCartStore((state) => state.productIds);
  const isCartRestored = useCartHydrated();
  const createOrder = useCreateOrderMutation();

  const items = [...productIds].map((productId) => ({
    productId,
    quantity: DEFAULT_QUANTITY,
  }));
  const isEmptyCart = items.length === 0;

  // 저장된 장바구니가 되살아난 뒤에 기록한다. 새로고침 직후에는 스토어가 아직 비어 있어,
  // 기다리지 않으면 담은 것이 있는데도 빈 주문서로 남는다
  useScreenViewOnce(() => trackOrderStart(items.map((item) => item.productId)), isCartRestored);

  return (
    <div className="week05-page">
      <Header />
      <main>
        <PageHeading title="주문서" description="장바구니에 담은 상품을 주문합니다." compact />
        <div className="week05-order">
          <section className="week05-section" aria-label="주문 상품">
            {isEmptyCart ? (
              <p>
                장바구니가 비어 있습니다. <Link href="/products">상품을 담아 주세요.</Link>
              </p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.productId}>
                    <span>{item.productId}</span>
                    <span>수량 {item.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {createOrder.isError ? <p role="alert">{createOrder.error.message}</p> : null}
          <button
            className="week05-button"
            type="button"
            onClick={() => createOrder.mutate({ items })}
            disabled={isEmptyCart || createOrder.isPending}
          >
            {createOrder.isPending ? '주문 중…' : '주문하기'}
          </button>
        </div>
      </main>
    </div>
  );
}
