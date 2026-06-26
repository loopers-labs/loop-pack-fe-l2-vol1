import { useState } from "react";

import { Card } from "@/market/card";
import type { Address } from "@/market/types";

import styles from "./DeliveryCard.module.css";

// 배송지 — 접기/펼치기와 선택 요약은 스스로 책임진다.
// 단, 실제 선택 동작(onSelectAddress)은 AddressForm → AddressField 로 통과시킨다.

// DeliverySection에서 DeliveryCard로 rename.
// 카드 패턴 도입 전 <section> 태그를 직접 쓰던 시절 이름이라,
// 내부가 Card로 바뀐 지금은 구현(section)이 아니라 역할(card)을 반영하도록 이름을 다른 카드들과 통일.
// selectedAddressId는 이 카드 외에 배송비 계산(address.isRemote → shippingFee)도 읽는 공유 상태라 checkoutPage에서 관리.
// 그래서 값과 변경 콜백을 props로 받음.
export function DeliveryCard({
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
          <p className={styles.addrSummary}>
            {selected.label} · {selected.recipient} ({selected.detail})
          </p>
        )}
      </Card.Body>
    </Card>
  );
}

// '도서산간 제외' 필터는 스스로 책임진다.
// 선택 동작(onSelectAddress)은 그대로 AddressField 로 통과시킨다.

// AddressForm/AddressField는 DeliveryCard 안에서만 쓰이는 하위 부품이라 같은 파일에 둠.
// 배송지 관련 변경이 이 파일에서 끝나도록 응집. 외부에서 쓸 일 없어 export하지 않음.
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
      <label className={styles.filter}>
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
    <label className={styles.addr}>
      <input type="radio" checked={selected} onChange={() => onSelect(address.id)} />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        {address.isRemote ? " · 도서산간" : ""}
      </span>
    </label>
  );
}
