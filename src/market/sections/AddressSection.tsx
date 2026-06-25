import { useState } from 'react';
import type { Address } from '@/market/types/address.types.ts';
import { Section } from '@/common/components/Section.tsx';
import { AddressForm } from '@/market/forms/AddressForm.tsx';

type AddressSectionProps = {
  /** 현재 선택된 배송지 (표시용) */
  selectedAddress: Address | null;
  /** 배송지 변경 시 호출 */
  onAddressChange: (address: Address) => void;
};

//주문/결제 페이지에서 배송지Section은 변경/접기에 대한 컨트롤만 함
export function AddressSection({ selectedAddress, onAddressChange }: AddressSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
        <AddressForm onSelectAddress={onAddressChange} />
      </div>
    </Section>
  );
}
