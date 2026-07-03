import type { ReactNode } from 'react';

interface OrderLineShellProps {
  thumbnail?: string;
  sub?: string;
  amount: number;
  isDiscount?: boolean;
  children: ReactNode;
}

/** 모든 주문 줄이 공유하는 레이아웃 셸 (썸네일 · 본문 · 금액). */
function OrderLineShell({ thumbnail, sub, amount, isDiscount, children }: OrderLineShellProps) {
  return (
    <div className="line">
      {thumbnail ? <span className="thumb">{thumbnail}</span> : null}
      <div className="grow">
        <span>{children}</span>
        {sub ? <small>{sub}</small> : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
    </div>
  );
}

/** 상품 줄 — 썸네일 · 옵션/수량 · 금액. */
function Product({
  name,
  option,
  quantity,
  amount,
  thumbnail,
}: {
  name: string;
  option: string;
  quantity: number;
  amount: number;
  thumbnail: string;
}) {
  return (
    <OrderLineShell thumbnail={thumbnail} sub={`${option} · 수량 ${quantity}`} amount={amount}>
      {name}
    </OrderLineShell>
  );
}

/** 일반 금액 줄 — 상품 금액 · 배송비 등. */
function Amount({ label, amount }: { label: string; amount: number }) {
  return <OrderLineShell amount={amount}>{label}</OrderLineShell>;
}

/** 할인 줄 — 쿠폰 · 적립금 등 (마이너스 표기). */
function Discount({ label, amount, code }: { label: string; amount: number; code?: string }) {
  return (
    <OrderLineShell sub={code} amount={amount} isDiscount>
      {label}
    </OrderLineShell>
  );
}

Product.displayName = 'OrderLine.Product';
Amount.displayName = 'OrderLine.Amount';
Discount.displayName = 'OrderLine.Discount';

/**
 * 주문 줄 컴포넌트 모음 (네임스페이스).
 * - AI가 설계를 도와준 코드
 * - 원인: `type` 분기로 모든 줄을 한 컴포넌트(`OrderLineRow`)가 처리해 줄 종류가 늘 때마다 중앙 분기가 커짐 → 결과: 변형별 컴포넌트 합성으로 바꿔 새 줄은 컴포넌트 추가만으로 확장(중앙 분기 불변).
 */
export const OrderLine = { Product, Amount, Discount };
