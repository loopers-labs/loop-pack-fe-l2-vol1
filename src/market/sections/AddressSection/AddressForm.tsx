import { useEffect, useState } from 'react';
import type { Address } from '@/market/types/address.types';
import { Radio } from '@/common/components/Radio.tsx';
import { Checkbox } from '@/common/components/Checkbox.tsx';
import { ADDRESSES } from '@/market/data.ts';

type AddressFormProps = {
  onSelectAddress: (address: Address) => void;
};

//AddressForm에서 주소를 가져온다. 나중에 API로 대체 가능 대비)
export function AddressForm({ onSelectAddress }: AddressFormProps) {
  const [onlyNear, setOnlyNear] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<Address>(ADDRESSES[0]);
  const list = onlyNear ? ADDRESSES.filter((a) => !a.isRemote) : ADDRESSES;

  useEffect(() => {
    onSelectAddress(selectedAddress);
  }, [selectedAddress, onSelectAddress]);

  // 필터로 현재 선택된 주소가 가려지면, 보이는 목록 중 첫 번째로 선택을 옮긴다. /* AI-generated */
  const handleOnlyNearChange = (checked: boolean) => {
    setOnlyNear(checked);
    if (!checked) return;

    const nearAddresses = ADDRESSES.filter((a) => !a.isRemote);
    if (selectedAddress.isRemote && nearAddresses.length > 0) {
      setSelectedAddress(nearAddresses[0]);
    }
  };

  return (
    <>
      <Checkbox
        labelClassName="filter"
        checked={onlyNear}
        onChange={(e) => handleOnlyNearChange(e.target.checked)}
        caption="도서산간 제외"
      />
      {list.map((address) => (
        <Radio
          key={address.id}
          labelClassName="addr"
          checked={address.id === selectedAddress.id}
          onChange={() => setSelectedAddress(address)}
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
