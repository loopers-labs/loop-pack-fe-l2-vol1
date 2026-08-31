'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useCart, useCartActions, type CartItem } from '@/entities/cart';
import { useCheckoutActions } from '@/entities/order';
import { useSessionUser } from '@/entities/session';
import { LoginRequiredDialog } from '@/features/auth';

export function CartPage() {
  return (
    <section className="week05-section" aria-labelledby="cart-title">
      <h1 id="cart-title">장바구니</h1>
      <CartContent />
    </section>
  );
}

function CartContent() {
  const router = useRouter();

  const user = useSessionUser();
  const items = useCart((cart) => cart.items);
  const { createCheckoutDraft } = useCheckoutActions();

  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  if (!items) {
    return <p>장바구니를 불러오는 중</p>;
  }

  if (items.length === 0) {
    return (
      <>
        <p>장바구니가 비어 있습니다.</p>
        <Link href="/products">상품 보러 가기</Link>
      </>
    );
  }

  const selectedItems = items.filter((item) => item.checked);

  const handlePurchaseClick = () => {
    // 구매 의사를 확정하는 순간, 선택 상품·수량을 주문 예정 목록(draft)으로 스냅샷 뜬다
    createCheckoutDraft(selectedItems);

    if (!user) {
      setIsLoginDialogOpen(true);

      return;
    }

    // draft가 주문 내용을 들고 있으므로 상품 ID를 URL에 싣지 않는다
    router.push('/orders/new');
  };

  return (
    <>
      <ul>
        {items.map((item) => (
          <CartItemRow key={item.productId} item={item} />
        ))}
      </ul>

      <button
        type="button"
        disabled={selectedItems.length === 0}
        onClick={handlePurchaseClick}
      >
        구매하기
      </button>

      <LoginRequiredDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        redirectPathAfterLogin="/orders/new"
      />
    </>
  );
}

function CartItemRow({ item }: { item: CartItem }) {
  const { toggleChecked, setQuantity, removeItems } = useCartActions();
  const { productId, quantity, checked } = item;

  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            toggleChecked(productId);
          }}
        />
        {productId}
      </label>

      <button
        type="button"
        aria-label={`${productId} 수량 줄이기`}
        disabled={quantity === 1}
        onClick={() => {
          setQuantity(productId, quantity - 1);
        }}
      >
        -
      </button>

      <span>수량 {quantity}</span>

      <button
        type="button"
        aria-label={`${productId} 수량 늘리기`}
        onClick={() => {
          setQuantity(productId, quantity + 1);
        }}
      >
        +
      </button>

      <button
        type="button"
        aria-label={`${productId} 빼기`}
        onClick={() => {
          removeItems([productId]);
        }}
      >
        빼기
      </button>
    </li>
  );
}
