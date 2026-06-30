import { useState, type ReactNode } from "react";
import type { Address, Coupon, PaymentMethod } from "./types";
import { ADDRESSES, CART, COUPONS, MEMBER, PAST_ORDERS } from "./data";
import { Price } from "./Price";
import { ProductLine } from "./ProductLine";
import { AmountLine } from "./AmountLine";
import { DiscountLine } from "./DiscountLine";
import { OrderStatusTag } from "./OrderStatusTag";
import { DeliveryMemo } from "./DeliveryMemo";
import "./market.css";

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: "신용/체크카드",
  transfer: "계좌이체",
  kakao: "카카오페이",
};

// 공통 껍데기 추출: 컴포넌트 계층을 명확히 하고, 스타일을 중앙 집중화하기 위해
// [AI 생성] children 타입(ReactNode) 보강 — 직접 검토·수정함
function SectionShell({ children }: { children: ReactNode }) {
  return <div className="section">{children}</div>;
}

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
    <>
      <div className="row between">
        <h2>배송지</h2>
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "접기" : "변경"}
        </button>
      </div>
      {expanded ? (
        <AddressForm
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddress={onSelectAddress}
        />
      ) : (
        <AddressView selectedAddress={selected} />
      )}
    </>
  );
}

// 구현과 조합을 섞지 않기!
function AddressView({ selectedAddress }: { selectedAddress: Address }) {
  return (
    <p className="addr-summary">
      {selectedAddress.label} · {selectedAddress.recipient} ({selectedAddress.detail})
    </p>
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
  const [hideRemote, setHideRemote] = useState(false);
  const list = hideRemote ? addresses.filter((a) => !a.isRemote) : addresses;
  return (
    <>
      <label className="filter">
        <input
          type="checkbox"
          checked={hideRemote}
          onChange={(e) => setHideRemote(e.target.checked)}
        />
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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoint, setUsePoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("card");
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

  // ── 최종 금액 ────────────────────────────────
  // 파생값이라 state로 박제하지 않고 렌더 중 계산한다(쿠폰·주소·적립금 변경에 반응).
  const baseTotal = itemTotal + shippingFee - couponDiscount - pointDiscount;
  // [AI 생성] VIP 할인 계산·항목화 — 직접 검토·수정함
  // VIP 10% 할인은 가격 정책이므로 여기서 계산하고, 항목으로도 노출해 합계가 맞게 한다.
  const vipDiscount = member.grade === "VIP" ? baseTotal - Math.round(baseTotal * 0.9) : 0;
  const finalPrice = baseTotal - vipDiscount;

  const applyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim());
    setAppliedCoupon(found ?? null);
    if (!found) alert("존재하지 않는 쿠폰이에요");
  };

  if (placed) {
    return (
      <div className="checkout">
        <h1>주문 완료</h1>
        <SectionShell>
          <p style={{ color: "var(--text-h)" }}>
            주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
          </p>
        </SectionShell>
        <button className="pay" onClick={() => setPlaced(false)}>
          주문서로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <SectionShell>
        <DeliverySection
          addresses={ADDRESSES}
          selectedAddressId={selectedAddressId}
          onSelectAddress={setSelectedAddressId}
        />
      </SectionShell>

      <SectionShell>
        <h2>배송 요청사항</h2>
        <DeliveryMemo />
      </SectionShell>

      <SectionShell>
        <h2>주문 상품</h2>
        {cart.map((cartItem) => (
          <ProductLine key={cartItem.id} item={cartItem} />
        ))}
      </SectionShell>

      <SectionShell>
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
      </SectionShell>

      <SectionShell>
        <h2>적립금</h2>
        <label>
          <input
            type="checkbox"
            checked={usePoint}
            onChange={(e) => setUsePoint(e.target.checked)}
          />
          적립금 사용 (보유 {member.point.toLocaleString()}P)
        </label>
        {usePoint ? (
          <input
            type="number"
            value={pointInput}
            onChange={(e) => setPointInput(Number(e.target.value))}
          />
        ) : null}
      </SectionShell>

      <SectionShell>
        <h2>결제수단</h2>
        {(["card", "transfer", "kakao"] satisfies PaymentMethod[]).map((m) => (
          // as는 컴파일러한테 믿으라고하는 단언이라, 오타도 잡지못합니다! 그래서 타입을 검증하면서도 그 값에서 추론된 더 구체적인 타입은 그대로 살려두는 satisfies를 사용했습니다.
          <label key={m}>
            <input type="radio" checked={payment === m} onChange={() => setPayment(m)} />
            {PAYMENT_LABEL[m]}
          </label>
        ))}
      </SectionShell>

      <SectionShell>
        <h2>결제 금액</h2>
        <AmountLine label="상품 금액" amount={itemTotal} />
        <AmountLine label="배송비" amount={shippingFee} />
        {appliedCoupon ? (
          <DiscountLine label="쿠폰 할인" amount={couponDiscount} code={appliedCoupon.code} />
        ) : null}
        {usePoint ? <DiscountLine label="적립금 사용" amount={pointDiscount} /> : null}
        {/* [AI 생성] VIP 할인 항목 — 직접 검토·수정함 */}
        {vipDiscount > 0 ? <DiscountLine label="VIP 할인" amount={vipDiscount} /> : null}
        <div className="total">
          <span>최종 결제 금액</span>
          <Price amount={finalPrice} />
        </div>
      </SectionShell>

      <SectionShell>
        <label>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          주문 내용 및 약관에 동의합니다
        </label>
        <button className="link" onClick={() => setIsTermsOpen(true)}>
          약관 보기
        </button>
      </SectionShell>

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

      <SectionShell>
        <h2>최근 주문</h2>
        {PAST_ORDERS.map((o) => (
          <div key={o.id} className="line">
            <div className="grow">{o.summary}</div>
            <OrderStatusTag status={o.status} />
          </div>
        ))}
      </SectionShell>
    </div>
  );
}
