import { useState } from 'react';
import type { Coupon, PaymentMethod } from './types';
import { calculateCheckoutPrice } from './calculateCheckoutPrice';
import { ADDRESSES, CART, COUPONS, MEMBER, PAST_ORDERS } from './data';
import { Price } from './_components/Price';
import { OrderLineRow } from './_components/OrderLineRow';
import { OrderStatusTag } from './_components/OrderStatusTag';
import { DeliveryMemo } from './_components/DeliveryMemo';
import { DeliverySection } from './_components/DeliverySection';
import './market.css';

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isUsingPoint, setIsUsingPoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);

  // find()는 undefined를 반환할 수 있어서 ! 대신 early return으로 처리
  const address = ADDRESSES.find((a) => a.id === selectedAddressId);

  const { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice } =
    calculateCheckoutPrice({
      cart,
      address,
      appliedCoupon,
      isUsingPoint,
      pointInput,
      member,
    });

  const applyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim());
    setAppliedCoupon(found ?? null);
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  if (!address) return null;

  if (isPlaced) {
    return (
      <div className="checkout">
        <h1>주문 완료</h1>
        <div className="section">
          <p style={{ color: 'var(--text-h)' }}>
            주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
          </p>
        </div>
        <button className="pay" onClick={() => setIsPlaced(false)}>
          주문서로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliverySection
        addresses={ADDRESSES}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
      />

      <div className="section">
        <h2>배송 요청사항</h2>
        <DeliveryMemo value={memo} onChange={setMemo} />
      </div>

      <div className="section">
        <h2>주문 상품</h2>
        {cart.map((it) => (
          <OrderLineRow
            key={it.id}
            type="product"
            label={it.name}
            amount={it.price * it.quantity}
            thumbnail={it.thumbnail}
            option={it.option}
            quantity={it.quantity}
          />
        ))}
      </div>

      <div className="section">
        <h2>쿠폰</h2>
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
      </div>

      <div className="section">
        <h2>적립금</h2>
        <label>
          <input
            type="checkbox"
            checked={isUsingPoint}
            onChange={(e) => setIsUsingPoint(e.target.checked)}
          />
          적립금 사용 (보유 {member.point.toLocaleString()}P)
        </label>
        {isUsingPoint && (
          <>
            {/* String 바인딩으로 leading zero 제거, Math.max로 음수 입력 차단 */}
            <input
              type="number"
              value={String(pointInput)}
              onChange={(e) =>
                setPointInput(Math.max(0, Number(e.target.value)))
              }
            />
            {pointInput > member.point && (
              <small>
                최대 {member.point.toLocaleString()}P까지 사용 가능합니다.
              </small>
            )}
          </>
        )}
      </div>

      <div className="section">
        <h2>결제수단</h2>
        {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => (
          <label key={m}>
            <input
              type="radio"
              checked={payment === m}
              onChange={() => setPayment(m)}
            />
            {PAYMENT_LABEL[m]}
          </label>
        ))}
      </div>

      <div className="section">
        <h2>결제 금액</h2>
        <OrderLineRow type="subtotal" label="상품 금액" amount={itemTotal} />
        <OrderLineRow type="shipping" label="배송비" amount={shippingFee} />
        {appliedCoupon && (
          <OrderLineRow
            type="coupon"
            label="쿠폰 할인"
            amount={couponDiscount}
            isDiscount
            couponCode={appliedCoupon.code}
          />
        )}
        {isUsingPoint && (
          <OrderLineRow
            type="point"
            label="적립금 사용"
            amount={pointDiscount}
            isDiscount
          />
        )}
        <div className="total">
          <span>최종 결제 금액</span>
          <Price amount={finalPrice} />
        </div>
      </div>

      <div className="section">
        <label>
          <input
            type="checkbox"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
          />
          주문 내용 및 약관에 동의합니다.
        </label>
        <button className="link" onClick={() => setIsTermsOpen(true)}>
          약관 보기
        </button>
      </div>

      <button
        className="pay"
        disabled={!isAgreed}
        onClick={() => setIsPlaced(true)}
      >
        {finalPrice.toLocaleString()}원 결제하기
      </button>

      {isTermsOpen && (
        <div className="modal" onClick={() => setIsTermsOpen(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <h3>이용 약관</h3>
            <p>
              주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가
              추가됩니다.
            </p>
            <button onClick={() => setIsTermsOpen(false)}>닫기</button>
          </div>
        </div>
      )}

      <div className="section">
        <h2>최근 주문</h2>
        {PAST_ORDERS.map((o) => (
          <div key={o.id} className="line">
            <div className="grow">{o.summary}</div>
            <OrderStatusTag status={o.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
