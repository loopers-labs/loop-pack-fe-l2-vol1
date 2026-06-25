import { useState } from "react";

import { Card } from "./card";
import { CouponCard } from "./CouponCard";
import { ADDRESSES, CART, COUPONS, MEMBER } from "./data";
import { DeliveryMemo } from "./DeliveryMemo";
import { OrderItemsCard } from "./OrderItemsCard";
import { OrderLineRow } from "./OrderLineRow";
import { PaymentMethodCard } from "./PaymentMethodCard";
import { PointsCard } from "./PointsCard";
import { Price } from "./Price";
import { RecentOrdersCard } from "./RecentOrdersCard";
import type { Address, Coupon } from "./types";

import "./market.css";

// 배송지 — 접기/펼치기와 선택 요약은 스스로 책임진다.
// 단, 실제 선택 동작(onSelectAddress)은 AddressForm → AddressField 로 통과시킨다.
function DeliverySection({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selected = addresses.find((a) => a.id === selectedAddressId)!;
  return (
    <Card>
      <Card.Header>
        <Card.Title>배송지</Card.Title>
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "접기" : "변경"}
        </button>
      </Card.Header>
      <Card.Body>
        {expanded ? (
          <AddressForm
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={onSelectAddress}
          />
        ) : (
          <p className="addr-summary">
            {selected.label} · {selected.recipient} ({selected.detail})
          </p>
        )}
      </Card.Body>
    </Card>
  );
}

// '도서산간 제외' 필터는 스스로 책임진다.
// 선택 동작(onSelectAddress)은 그대로 AddressField 로 통과시킨다.
function AddressForm({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
}) {
  const [onlyNear, setOnlyNear] = useState(false);
  const list = onlyNear ? addresses.filter((a) => !a.isRemote) : addresses;
  return (
    <>
      <label className="filter">
        <input type="checkbox" checked={onlyNear} onChange={(e) => setOnlyNear(e.target.checked)} />
        도서산간 제외
      </label>
      {list.map((a) => (
        <AddressField
          key={a.id}
          address={a}
          selected={a.id === selectedAddressId}
          onSelect={onSelectAddress}
        />
      ))}
    </>
  );
}

function AddressField({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <label className="addr">
      <input type="radio" checked={selected} onChange={() => onSelect(address.id)} />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        {address.isRemote ? " · 도서산간" : ""}
      </span>
    </label>
  );
}

export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoint, setUsePoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (address.isRemote) shippingFee += 3000;

  // ── 쿠폰 정책 ────────────────────────────────
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;

  // ── 적립금 정책 ──────────────────────────────
  const pointDiscount = usePoint ? Math.min(pointInput, member.point, itemTotal) : 0;

  // 최종 금액을 state 에 담아둔다.
  const [finalPrice] = useState(itemTotal + shippingFee - couponDiscount - pointDiscount);

  /**
   * appliedCoupon은 쿠폰 카드뿐 아니라 결제 금액 계산(couponDiscount → finalPrice)도 읽는 공유 상태라 공통 부모인 CheckoutPage에서 관리
   * 따라서, 그 값을 바꾸는 이 핸들러도 페이지에 둠. CouponCard는 onApply로 "적용" 요청만 실행하도록 분리
   */
  const handleApplyCoupon = (code: string) => {
    const found = COUPONS.find((c) => c.code === code.trim());
    /**
     * 못 찾은 경우를 먼저 처리(early return). 성공 케이스를 아래에 두어 "검증 먼저, 처리 나중"
     * 단일 적용 방식이라, 새 코드가 틀리면 기존에 적용된 쿠폰도 무효화
     */
    if (!found) {
      alert("존재하지 않는 쿠폰이에요");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(found);
  };

  if (placed) {
    return (
      <div className="checkout">
        <h1>주문 완료</h1>
        <div className="section">
          <p style={{ color: "var(--text-h)" }}>
            주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
          </p>
        </div>
        <button className="pay" onClick={() => setPlaced(false)}>
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

      <Card>
        <Card.Header>
          <Card.Title>배송 요청사항</Card.Title>
        </Card.Header>
        <Card.Body>
          <DeliveryMemo />
        </Card.Body>
      </Card>

      <OrderItemsCard items={cart} />

      <CouponCard appliedCoupon={appliedCoupon} onApply={handleApplyCoupon} />

      <PointsCard
        point={member.point}
        usePoint={usePoint}
        pointInput={pointInput}
        onUsePointChange={setUsePoint}
        onPointInputChange={setPointInput}
      />

      <PaymentMethodCard />

      <Card>
        <Card.Title>결제 금액</Card.Title>
        <Card.Body>
          <OrderLineRow type="subtotal" label="상품 금액" amount={itemTotal} />
          <OrderLineRow type="shipping" label="배송비" amount={shippingFee} />
          {appliedCoupon ? (
            <OrderLineRow
              type="coupon"
              label="쿠폰 할인"
              amount={couponDiscount}
              isDiscount
              couponCode={appliedCoupon.code}
            />
          ) : null}
          {usePoint ? (
            <OrderLineRow type="point" label="적립금 사용" amount={pointDiscount} isDiscount />
          ) : null}
          <div className="total">
            <span>최종 결제 금액</span>
            <Price amount={finalPrice} member={member} />
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <label>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            주문 내용 및 약관에 동의합니다
          </label>
          <button className="link" onClick={() => setIsTermsOpen(true)}>
            약관 보기
          </button>
        </Card.Body>
      </Card>

      <button className="pay" disabled={!agreed} onClick={() => setPlaced(true)}>
        {finalPrice.toLocaleString()}원 결제하기
      </button>

      {isTermsOpen ? (
        <div className="modal" onClick={() => setIsTermsOpen(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <h3>이용 약관</h3>
            <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
            <button onClick={() => setIsTermsOpen(false)}>닫기</button>
          </div>
        </div>
      ) : null}

      {/* <Card>
        <Card.Title>최근 주문</Card.Title>
        <Card.Body>
          {PAST_ORDERS.map((o) => (
            <div key={o.id} className="line">
              <div className="grow">{o.summary}</div>
              <OrderStatusTag
                isPaid={o.status === "paid"}
                isPreparing={o.status === "preparing"}
                isShipped={o.status === "shipped"}
                isDelivered={o.status === "delivered"}
                isCancelled={o.status === "cancelled"}
              />
            </div>
          ))}
        </Card.Body>
      </Card> */}
      <RecentOrdersCard />
    </div>
  );
}
