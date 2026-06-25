import { useState } from 'react';
import type { Address } from '../types';
import { AddressField } from './AddressField';

type Props = {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
};

// '도서산간 제외' 필터는 스스로 책임진다.
// 선택 동작(onSelectAddress)은 그대로 AddressField 로 통과시킨다.
export function AddressForm({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: Props) {
  const [isOnlyNear, setIsOnlyNear] = useState(false);
  const list = isOnlyNear ? addresses.filter((a) => !a.isRemote) : addresses;
  return (
    <>
      <label className="filter">
        <input
          type="checkbox"
          checked={isOnlyNear}
          onChange={(e) => setIsOnlyNear(e.target.checked)}
        />
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
