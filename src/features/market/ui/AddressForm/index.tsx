import { For } from '@ilokesto/utilinent'
import { useState } from 'react'

import type { Address } from '@/entities/market'

import { AddressField } from './AddressField'
import { RemortAreaFilterToggle } from './RemoteAreaFilterToggle'

// '도서산간 제외' 필터는 스스로 책임진다.
// 선택 동작(onSelectAddress)은 그대로 AddressField 로 통과시킨다.
export function AddressForm({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Array<Address>
  selectedAddressId: string
  onSelectAddress: (id: string) => void
}) {
  const [onlyNear, setOnlyNear] = useState(false)
  const list = onlyNear ? addresses.filter((a) => !a.isRemote) : addresses
  return (
    <>
      <RemortAreaFilterToggle onlyNear={onlyNear} setOnlyNear={setOnlyNear} />
      <For each={list}>
        {(address) => (
          <AddressField
            key={address.id}
            address={address}
            selected={address.id === selectedAddressId}
            onSelect={onSelectAddress}
          />
        )}
      </For>
    </>
  )
}
