import { useState } from 'react';
import type { Address } from '../shared/types/types';

export const Delivery = ({
  addresses,
  selectedAddress,
  onSelectAddress,
}: {
  addresses: Address[];
  selectedAddress: Address;
  onSelectAddress: (address: Address) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="section">
      <div className="row between">
        <h2>배송지</h2>
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : '변경'}
        </button>
      </div>
      {expanded ? (
        <AddressForm
          addresses={addresses}
          selectedAddress={selectedAddress}
          onSelectAddress={onSelectAddress}
        />
      ) : (
        <p className="addr-summary">
          {selectedAddress.label} · {selectedAddress.recipient} ({selectedAddress.detail})
        </p>
      )}
    </div>
  );
};

// '도서산간 제외' 필터는 스스로 책임진다.
// 선택 동작(onSelectAddress)은 그대로 AddressField 로 통과시킨다.
function AddressForm({
  addresses,
  selectedAddress,
  onSelectAddress,
}: {
  addresses: Address[];
  selectedAddress: Address;
  onSelectAddress: (address: Address) => void;
}) {
  const [remoteExcludechecked, setRemoteExcludechecked] = useState(false); // 도서산간 제외 체크
  const list = remoteExcludechecked ? addresses.filter((a) => !a.isRemote) : addresses;

  const handleIsRemoteCheckboxToggle = (checked: boolean) => {
    setRemoteExcludechecked(checked);
    // 도서산간 제외를 체크하지 않은 경우
    if (!checked) return;

    // 도서산간 제외를 체크한 경우
    // 체크되었던 주소가 일반 지역인 경우 유지
    if (!selectedAddress.isRemote) return;

    // 체크되었던 주소가 도서산간인 경우 체크를 첫 번째 일반 지역으로 옮김
    const firstNormalAddress = addresses.find((a) => !a.isRemote);

    if (firstNormalAddress) {
      onSelectAddress(firstNormalAddress);
    }
  };

  return (
    <>
      <label className="filter">
        <input
          type="checkbox"
          checked={remoteExcludechecked}
          onChange={(e) => handleIsRemoteCheckboxToggle(e.target.checked)}
        />
        도서산간 제외
      </label>
      {list.map((a) => (
        <AddressField
          key={a.id}
          address={a}
          selected={a.id === selectedAddress.id}
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
  onSelect: (address: Address) => void;
}) {
  return (
    <label className="addr">
      <input type="radio" checked={selected} onChange={() => onSelect(address)} />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        {address.isRemote ? ' · 도서산간' : ''}
      </span>
    </label>
  );
}
