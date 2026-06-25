import { useState } from 'react';
import type { Address } from '@/market/types/address.types';
import { Section } from '@/common/components/Section.tsx';
import { AddressForm } from '@/market/sections/AddressSection/AddressForm.tsx';

type AddressSectionProps = {
  onRemoteChange: (isRemote: boolean) => void;
};

//주문/결제 페이지에서 배송지Section은 변경/접기에 대한 컨트롤만 함
export function AddressSection({ onRemoteChange }: AddressSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const handleSelectAddress = (address: Address) => {
    onRemoteChange(address.isRemote);
    setSelectedAddress(address);
  };

  return (
    <Section
      title="배송지"
      rightSlot={
        <button className="link" onClick={() => setIsExpanded((v) => !v)}>
          {isExpanded ? '접기' : '변경'}
        </button>
      }
    >
      {!isExpanded && (
        <p className="addr-summary">
          {selectedAddress?.label} · {selectedAddress?.recipient} ({selectedAddress?.detail})
        </p>
      )}
      <div hidden={!isExpanded}>
        <AddressForm onSelectAddress={handleSelectAddress} />
      </div>
    </Section>
  );
}
