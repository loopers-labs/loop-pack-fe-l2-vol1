"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCartStore } from "@/entities/cart";
import { indexProductsById, productCatalogQueries } from "@/entities/product";
import { PlaceOrderButton } from "@/features/place-order";
import { useTrackOnMount } from "@/shared/analytics";
import { CommerceApiError } from "@/shared/api/commerce-client";
import { Placeholder } from "@/shared/ui/placeholder";

// 장바구니는 상품 id 만 들고 있다. 주문 API 응답에도 금액이 없으니 상품 데이터로 직접 계산한다
export function CheckoutPage() {
  const ids = useCartStore((state) => state.ids);
  const { data, isPending, isError, error, refetch } = useQuery(productCatalogQueries.all());

  // 주문서 진입. 빈 장바구니로 들어온 것은 주문 시작이 아니다
  useTrackOnMount("order_start", { productIds: [...ids], itemCount: ids.size }, ids.size > 0);

  if (ids.size === 0) {
    return (
      <section className="week05-section" aria-labelledby="checkout-title">
        <h1 id="checkout-title">주문서</h1>
        <Placeholder
          title="장바구니가 비어 있어요"
          description="상품 목록에서 담기를 누르면 여기에 모여요."
          action={<Link href="/products">상품 보러 가기</Link>}
        />
      </section>
    );
  }

  if (isPending) {
    return (
      <section className="week05-section" aria-busy="true" aria-label="주문서 불러오는 중">
        <h1>주문서</h1>
        <p>상품 정보를 불러오는 중…</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="week05-section">
        <h1>주문서</h1>
        <Placeholder
          role="alert"
          title="상품 정보를 불러오지 못했어요"
          description={
            error instanceof CommerceApiError ? error.message : "잠시 후 다시 시도해 주세요."
          }
          action={
            <button type="button" onClick={() => refetch()}>
              다시 시도
            </button>
          }
        />
      </section>
    );
  }

  const catalog = indexProductsById(data);
  const lines = [...ids].map((id) => ({ id, product: catalog.get(id) ?? null }));
  const total = lines.reduce((sum, line) => sum + (line.product?.price ?? 0), 0);

  return (
    <section className="week05-section week09-narrow" aria-labelledby="checkout-title">
      <h1 id="checkout-title">주문서</h1>
      <ul className="week09-lines" aria-label="주문 상품">
        {lines.map(({ id, product }) => (
          <li key={id}>
            <span>{product === null ? `알 수 없는 상품 (${id})` : product.name}</span>
            <span>수량 1</span>
            <strong>{product === null ? "-" : `${product.price.toLocaleString()}원`}</strong>
          </li>
        ))}
      </ul>
      <p className="week09-total">
        총 결제 금액 <strong>{total.toLocaleString()}원</strong>
      </p>
      <PlaceOrderButton
        items={lines.map(({ id }) => ({ productId: id, quantity: 1 }))}
        totalPrice={total}
      />
    </section>
  );
}
