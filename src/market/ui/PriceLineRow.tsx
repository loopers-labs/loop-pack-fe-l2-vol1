import type { PriceType } from '../shared/types/types';

const LABEL_MAP: Record<PriceType, string> = {
  subtotal: '상품 금액',
  shipping: '배송비',
  coupon: '쿠폰 할인',
  point: '포인트 사용',
};

// 불필요한 isDiscount Props 제거(type으로 판단 가능)
type PriceLineRowProps = {
  type: PriceType;
  amount: number;
  couponCode?: string;
};

// 1번, 3번 위배 -> 별도의 컴포넌트로 분리하기 -> 불필요한 props 제거
export function PriceLineRow({ type, amount, couponCode }: PriceLineRowProps) {
  const label = LABEL_MAP[type];
  const isDiscount = type === 'coupon' || type === 'point';
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
        {type === 'coupon' && couponCode ? <small>{couponCode}</small> : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
      {/* 새 줄 타입(부분취소, 선물포장, 결제수단별 즉시할인...)이 생길 때마다 위 분기가 늘어난다 */}
    </div>
  );
}
