import { useState } from 'react';
import type { Address } from '../types';
import { AddressForm } from './AddressForm';

type Props = {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
};

// 배송지 — 접기/펼치기와 선택 요약은 스스로 책임진다.
// 단, 실제 선택 동작(onSelectAddress)은 AddressForm → AddressField 로 통과시킨다.
export function DeliverySection({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  // find()는 undefined를 반환할 수 있어서 ! 대신 early return으로 처리
  const selected = addresses.find((a) => a.id === selectedAddressId);
  if (!selected) return null;
  return (
    <div className="section">
      <div className="row between">
        <h2>배송지</h2>
        <button className="link" onClick={() => setIsExpanded((v) => !v)}>
          {isExpanded ? '접기' : '변경'}
        </button>
      </div>
      {isExpanded ? (
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
    </div>
  );
}
