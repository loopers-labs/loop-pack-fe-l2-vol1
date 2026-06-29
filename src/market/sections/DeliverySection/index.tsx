import { useState } from "react";
import type { Address } from "../../types";
import { AddressForm } from "./AddressForm";

// 배송지 — 접기/펼치기와 선택 요약은 스스로 책임진다.
// 단, 실제 선택 동작(onSelectAddress)은 AddressForm → AddressField 로 통과시킨다.
export function DeliverySection({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
}) {
  const [isAddressListOpen, setIsAddressListOpen] = useState(false);
  const selected = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="section">
      <div className="row between">
        <h2>배송지</h2>
        <button className="link" onClick={() => setIsAddressListOpen((v) => !v)}>
          {isAddressListOpen ? "접기" : "변경"}
        </button>
      </div>
      {isAddressListOpen ? (
        <AddressForm
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddress={onSelectAddress}
        />
      ) : (
        <p className="addr-summary">
          {selected
            ? `${selected.label} · ${selected.recipient} (${selected.detail})`
            : "선택된 배송지를 찾을 수 없습니다."}
        </p>
      )}
    </div>
  );
}
