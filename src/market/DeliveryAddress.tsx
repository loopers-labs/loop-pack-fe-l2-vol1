import { useState } from 'react';

import { SectionCard } from './SectionCard';
import { ADDRESSES } from './data';
import type { Address } from './types';

type Props = {
  addressId: string;
  onChangeAddress: (id: string) => void;
};

export function DeliveryAddress({ addressId, onChangeAddress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const selected = ADDRESSES.find((a) => a.id === addressId) ?? ADDRESSES[0];
  return (
    <SectionCard
      title="배송지"
      action={
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : '변경'}
        </button>
      }
    >
      {expanded ? (
        <AddressForm addressId={addressId} onChangeAddress={onChangeAddress} />
      ) : (
        <p className="addr-summary">
          {selected.label} · {selected.recipient} ({selected.detail})
        </p>
      )}
    </SectionCard>
  );
}

function AddressForm({ addressId, onChangeAddress }: Props) {
  const [onlyNear, setOnlyNear] = useState(false);
  const list = onlyNear ? ADDRESSES.filter((a) => !a.isRemote) : ADDRESSES;
  return (
    <>
      <label className="filter">
        <input
          type="checkbox"
          checked={onlyNear}
          onChange={(e) => setOnlyNear(e.target.checked)}
        />
        도서산간 제외
      </label>
      {list.map((a) => (
        <AddressField
          key={a.id}
          address={a}
          selected={a.id === addressId}
          onSelect={onChangeAddress}
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
      <input
        type="radio"
        checked={selected}
        onChange={() => onSelect(address.id)}
      />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        {address.isRemote ? ' · 도서산간' : ''}
      </span>
    </label>
  );
}
