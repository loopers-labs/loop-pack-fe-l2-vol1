import { useState } from 'react';
import type { Address } from './types';
import { ADDRESSES } from './data';

function AddressField({ address, selected, onSelect }: { address: Address; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <label className="addr">
      <input type="radio" checked={selected} onChange={() => onSelect(address.id)} />
      <span>
        {address.label} · {address.recipient} ({address.detail}){address.isRemote ? ' · 도서산간' : ''}
      </span>
    </label>
  );
}

function AddressForm({ selectedAddressId, onSelectAddress, onlyNear, onToggleOnlyNear }: { selectedAddressId: string; onSelectAddress: (id: string) => void; onlyNear: boolean; onToggleOnlyNear: (next: boolean) => void }) {
  const list = onlyNear ? ADDRESSES.filter((a) => !a.isRemote) : ADDRESSES;
  return (
    <>
      <label className="filter">
        <input type="checkbox" checked={onlyNear} onChange={(e) => onToggleOnlyNear(e.target.checked)} />
        도서산간 제외
      </label>
      {list.map((a) => (
        <AddressField key={a.id} address={a} selected={a.id === selectedAddressId} onSelect={onSelectAddress} />
      ))}
    </>
  );
}

interface DeliveryAddressSectionProps {
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
}

export function DeliveryAddressSection({ selectedAddressId, onSelectAddress }: DeliveryAddressSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [onlyNear, setOnlyNear] = useState(false);

  const selected = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  const handleToggleOnlyNear = (newOnlyNear: boolean) => {
    setOnlyNear(newOnlyNear);
    if (!newOnlyNear) return;
    if (selected.isRemote) {
      const firstNear = ADDRESSES.find((a) => !a.isRemote);
      if (firstNear) onSelectAddress(firstNear.id);
    }
  };

  return (
    <div className="section">
      <div className="row between">
        <h2>배송지</h2>
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : '변경'}
        </button>
      </div>
      {expanded ? (
        <AddressForm selectedAddressId={selectedAddressId} onSelectAddress={onSelectAddress} onlyNear={onlyNear} onToggleOnlyNear={handleToggleOnlyNear} />
      ) : (
        <p className="addr-summary">
          {selected.label} · {selected.recipient} ({selected.detail})
        </p>
      )}
    </div>
  );
}
