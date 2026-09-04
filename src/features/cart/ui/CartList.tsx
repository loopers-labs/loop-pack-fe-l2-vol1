"use client";

import type { ReactNode } from "react";

import Link, { useLinkStatus } from "next/link";

import { useCartHydrated, useCartIds, useRemoveFromCart } from "@/entities/cart";
import buttonStyles from "@/shared/ui/button.module.css";
import { LoadingDots } from "@/shared/ui/loading-dots/LoadingDots";

import styles from "./CartList.module.css";

// 주문서로 이동하는 동안(navigation pending)엔 로그인 버튼처럼 로딩 점을 보인다.
// useLinkStatus는 Link 자식에서만 동작하므로 라벨을 이 작은 컴포넌트로 분리한다.
function OrderFormLinkLabel() {
  const { pending } = useLinkStatus();
  return pending ? <LoadingDots /> : <>주문서로 이동</>;
}

type CartListProps = {
  // 상품이 있을 때만 보일 상단 도구 영역(예: 장바구니 비우기). 다른 feature와의 합성은 페이지가 주입한다.
  toolbar?: ReactNode;
};

// 공개 장바구니 뷰. 익명으로 담은 것을 로그인 없이 확인·수정하고, 주문은 주문서에서 로그인 게이트를 지난다.
export function CartList({ toolbar }: CartListProps) {
  const cartHydrated = useCartHydrated();
  const cartIds = useCartIds();
  const removeFromCart = useRemoveFromCart();

  // 복원 전엔 빈 목록을 잘못 보여주지 않도록 하이드레이션을 기다린다.
  if (!cartHydrated) {
    return <p className={styles.message}>불러오는 중…</p>;
  }
  if (cartIds.length === 0) {
    return <p className={styles.message}>장바구니가 비어 있습니다.</p>;
  }

  return (
    <>
      {toolbar ? <div className={styles.toolbar}>{toolbar}</div> : null}
      <ul className={styles.list}>
        {cartIds.map((id) => (
          <li key={id} className={styles.item}>
            {id}
            <button type="button" className={styles.remove} onClick={() => removeFromCart(id)}>
              빼기
            </button>
          </li>
        ))}
      </ul>
      <Link href="/order-form" className={buttonStyles.primary} aria-label="주문서로 이동">
        <OrderFormLinkLabel />
      </Link>
    </>
  );
}
