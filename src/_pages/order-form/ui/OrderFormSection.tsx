'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/apiFetch';
import { formatPrice } from '@/shared/lib/formatPrice';
import { useCartStore } from '@/entities/cart';
import { createOrder, orderQueries } from '@/entities/order';
import { productCatalogQueries } from '@/entities/product';
import { authQueries } from '@/entities/auth';
import { trackOrderComplete } from '@/analytics/events';
import { OrderLine } from '@/widgets/order-line';

export default function OrderFormSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cartItems = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.remove);
  const { data: catalog } = useSuspenseQuery(productCatalogQueries.lookup());
  const { data: user } = useQuery(authQueries.me());

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (_order, request) => {
      if (user) {
        // 주문 API는 금액을 안 주므로(과제 39번 줄) 카탈로그 가격으로 직접 계산한다.
        const orderTotalPrice = request.items.reduce((sum, { productId, quantity }) => {
          const product = catalog[productId];
          return sum + (product ? product.price * quantity : 0);
        }, 0);
        trackOrderComplete({ productIds: request.items.map((item) => item.productId), totalPrice: orderTotalPrice, userId: user.id });
      }
      // 주문된 상품만 장바구니에서 뺀다. 지금은 장바구니 전체를 주문하므로 결과적으로 비워지지만,
      // 기준을 "주문에 담겨 나간 항목"으로 두면 나중에 일부만 주문하게 되어도 그대로 맞는다.
      // 성공했을 때만 뺀다 — 실패한 주문이 장바구니를 지우면 사용자가 담은 것을 잃는다.
      request.items.forEach((item) => removeFromCart(item.productId));
      // 주문 내역이 방금 만든 주문을 포함하도록 다시 받게 한다.
      void queryClient.invalidateQueries({ queryKey: orderQueries.all() });
      // 별도 주문 완료 화면을 두지 않는다 — 주문 내역 맨 위에 방금 주문이 보인다.
      router.push('/orders');
    }
  });

  // 주문에 성공하면 위에서 장바구니를 비우므로 cartItems가 사라진다. 주문 내역으로 이동이 끝날
  // 때까지 화면이 빈 목록과 0원으로 깜빡이지 않도록, 성공 뒤에는 방금 보낸 항목을 그대로 그린다.
  const orderedItems = orderMutation.isSuccess ? (orderMutation.variables?.items ?? null) : null;
  const items = orderedItems ?? [...cartItems].map(([productId, quantity]) => ({ productId, quantity }));

  const totalPrice = items.reduce((sum, { productId, quantity }) => {
    const product = catalog[productId];
    return sum + (product ? product.price * quantity : 0);
  }, 0);
  const hasUnknownProduct = items.some(({ productId }) => !catalog[productId]);

  const errorMessage = orderMutation.error instanceof ApiError ? orderMutation.error.message : orderMutation.isError ? '주문하지 못했습니다.' : '';

  return (
    <>
      <section className="content-section">
        <h2>주문 상품</h2>
        {/* 결제 직전 품목은 고정한다. 수량을 바꾸려면 장바구니로 돌아간다 — 커머스 주문서의 공통 규칙이다. */}
        <ul className="order-line-list order-line-list-boxed">
          {items.map(({ productId, quantity }) => (
            <OrderLine key={productId} productId={productId} product={catalog[productId]} quantity={quantity} />
          ))}
        </ul>
        <p className="order-line-note">
          수량을 바꾸려면 <Link href="/cart">장바구니</Link>에서 수정해 주세요.
        </p>
      </section>

      <section className="content-section">
        <h2 className="visually-hidden">결제 금액</h2>
        <p className="order-total">
          <span>총 결제 금액</span>
          <strong>
            {formatPrice(totalPrice)}
            {hasUnknownProduct && <span className="order-card-note"> (상품 정보를 불러오지 못한 항목 제외)</span>}
          </strong>
        </p>

        <div className="order-submit">
          {/* 오류가 나타날 때 아래 주문 버튼이 밀리면 잘못 누르게 된다. 자리를 항상 예약해 둔다 */}
          <div className="order-submit-error">{errorMessage !== '' && <p role="alert">{errorMessage}</p>}</div>
          <button type="button" disabled={orderMutation.isPending} onClick={() => orderMutation.mutate({ items })}>
            {formatPrice(totalPrice)} 주문하기
          </button>
        </div>
      </section>
    </>
  );
}
