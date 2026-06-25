import { useState } from 'react';
import type { Address } from '../../types/address.types';
import { Radio } from '../../../common/components/Radio.tsx';
import { Checkbox } from '../../../common/components/Checkbox.tsx';

type AddressFormProps = {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
};

export function AddressForm({ addresses, selectedAddressId, onSelectAddress }: AddressFormProps) {
  const [onlyNear, setOnlyNear] = useState(false);
  const list = onlyNear ? addresses.filter((a) => !a.isRemote) : addresses;
  return (
    <>
      <Checkbox
        labelClassName="filter"
        checked={onlyNear}
        onChange={(e) => setOnlyNear(e.target.checked)}
        caption="도서산간 제외"
      />
      {list.map((address) => (
        <Radio
          key={address.id}
          labelClassName="addr"
          checked={address.id === selectedAddressId}
          onChange={() => onSelectAddress(address.id)}
        >
          <span>
            {address.label} · {address.recipient} ({address.detail})
            {address.isRemote ? ' · 도서산간' : ''}
          </span>
        </Radio>
      ))}
    </>
  );
}
