import { useState } from 'react';

import { AddressForm } from './components/Address/AddressForm';
import { DeliverySection } from './components/DeliverySection';
import { OrderLine } from './components/OrderLine';
import { OrderStatusTag } from './components/OrderStatusTag';
import { Price } from './components/Price';
import { Section } from './components/Section';
import TermsModal from './components/TermsModal';
import { ADDRESSES, CART, COUPONS, MEMBER, PAST_ORDERS } from './data';
import './market.css';
import type { Coupon, PaymentMethod } from './types';
import { calcPointDiscount } from './utils/calcPointDiscount';
import { calcShippingFee } from './utils/calcShippingFee';
import { calcVipDiscount } from './utils/calcVipDiscount';

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

export function CheckoutPage() {
  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoint, setUsePoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [memo, setMemo] = useState('');

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = CART.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const shippingFee = calcShippingFee(itemTotal, address.isRemote);

  // ── 쿠폰 정책 ────────────────────────────────
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;

  // ── 적립금 정책 ──────────────────────────────
  const pointDiscount = usePoint ? calcPointDiscount(pointInput, MEMBER.point, itemTotal) : 0;

  const finalPrice = itemTotal + shippingFee - couponDiscount - pointDiscount;
  const payableAmount = calcVipDiscount(finalPrice, MEMBER.grade);

  const applyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim());
    setAppliedCoupon(found ?? null);
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  if (placed) {
    return (
      <div className="checkout">
        <h1>주문 완료</h1>
        <Section>
          <p style={{ color: 'var(--text-h)' }}>주문이 접수되었어요. 결제 금액 {payableAmount.toLocaleString()}원</p>
        </Section>
        <button className="pay" onClick={() => setPlaced(false)}>
          주문서로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliverySection summary={`${address.label} · ${address.recipient} (${address.detail})`}>
        <AddressForm
          addresses={ADDRESSES}
          selectedAddressId={selectedAddressId}
          onSelectAddress={setSelectedAddressId}
        />
      </DeliverySection>

      <Section header={<h2>배송 요청사항</h2>}>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)"
        />
      </Section>

      <Section header={<h2>주문 상품</h2>}>
        {CART.map((it) => (
          <OrderLine.Product
            key={it.id}
            name={it.name}
            amount={it.price * it.quantity}
            thumbnail={it.thumbnail}
            option={it.option}
            quantity={it.quantity}
          />
        ))}
      </Section>

      <Section header={<h2>쿠폰</h2>}>
        <div className="row">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="쿠폰 코드 (예: WELCOME5000)"
          />
          <button onClick={applyCoupon}>적용</button>
        </div>
        {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
      </Section>

      <Section header={<h2>적립금</h2>}>
        <label>
          <input type="checkbox" checked={usePoint} onChange={(e) => setUsePoint(e.target.checked)} />
          적립금 사용 (보유 {MEMBER.point.toLocaleString()}P)
        </label>

        {usePoint ? (
          <input
            type="number"
            value={pointInput}
            onChange={(e) => setPointInput(Math.max(0, Number(e.target.value)))}
          />
        ) : null}
      </Section>

      <Section header={<h2>결제수단</h2>}>
        {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => (
          <label key={m}>
            <input type="radio" checked={payment === m} onChange={() => setPayment(m)} />
            {PAYMENT_LABEL[m]}
          </label>
        ))}
      </Section>

      <Section header={<h2>결제 금액</h2>}>
        <OrderLine.Amount label="상품 금액" amount={itemTotal} />
        <OrderLine.Amount label="배송비" amount={shippingFee} />

        {appliedCoupon ? (
          <OrderLine.Discount label="쿠폰 할인" amount={couponDiscount} code={appliedCoupon.code} />
        ) : null}

        {usePoint ? <OrderLine.Discount label="적립금 사용" amount={pointDiscount} /> : null}

        <div className="total">
          <span>최종 결제 금액</span>
          <Price amount={payableAmount} />
        </div>
      </Section>

      <Section>
        <label>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          주문 내용 및 약관에 동의합니다
        </label>
        <button className="link" onClick={() => setIsTermsOpen(true)}>
          약관 보기
        </button>
      </Section>

      <button className="pay" disabled={!agreed} onClick={() => setPlaced(true)}>
        {payableAmount.toLocaleString()}원 결제하기
      </button>

      {isTermsOpen ? <TermsModal onClose={() => setIsTermsOpen(false)} /> : null}

      <Section header={<h2>최근 주문</h2>}>
        {PAST_ORDERS.map((o) => (
          <div key={o.id} className="line">
            <div className="grow">{o.summary}</div>
            <OrderStatusTag status={o.status} />
          </div>
        ))}
      </Section>
    </div>
  );
}
