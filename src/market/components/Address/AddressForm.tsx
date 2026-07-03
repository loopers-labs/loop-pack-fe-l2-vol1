import { useState } from 'react';

import type { Address } from '@/market/types';

import { AddressField } from './AddressField';

interface AddressFormProps {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
}

/**
 * 배송지 목록 + '도서산간 제외' 필터. 선택 동작(onSelectAddress)은 AddressField로 통과시킨다.
 * - /components/Address 디렉토리를 생성하여 관심사끼리 파일을 모아 코드 응집성을 확보
 *
 * - 원인: CheckoutPage 파일 안에 컴포넌트 단위로 존재 → 단일 컴포넌트 파일로 분리하여 유지보수성을 확보
 */
export const AddressForm = ({ addresses, selectedAddressId, onSelectAddress }: AddressFormProps) => {
  const [onlyNear, setOnlyNear] = useState(false);

  const list = onlyNear ? addresses.filter((a) => !a.isRemote) : addresses;

  return (
    <>
      <label className="filter">
        <input type="checkbox" checked={onlyNear} onChange={(e) => setOnlyNear(e.target.checked)} />
        도서산간 제외
      </label>

      {list.map((a) => (
        <AddressField key={a.id} address={a} selected={a.id === selectedAddressId} onSelect={onSelectAddress} />
      ))}
    </>
  );
};
