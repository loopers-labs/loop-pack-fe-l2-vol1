import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Address } from '../../types/address.types';
import { Section } from '../../../common/components/Section.tsx';

type AddressSectionProps = {
  selectedAddress: Address;
  children: ReactNode;
};

export function AddressSection({ selectedAddress, children }: AddressSectionProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Section
      title="배송지"
      rightSlot={
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : '변경'}
        </button>
      }
    >
      {expanded ? (
        children
      ) : (
        <p className="addr-summary">
          {selectedAddress.label} · {selectedAddress.recipient} ({selectedAddress.detail})
        </p>
      )}
    </Section>
  );
}
