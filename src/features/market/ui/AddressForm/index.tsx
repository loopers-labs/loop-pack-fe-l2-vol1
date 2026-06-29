import { For } from '@ilokesto/utilinent'
import { useState } from 'react'

import type { Address } from '@/entities/market'
import { RadioGroup } from '@/shared/ui'

import { AddressField } from './AddressField'
import { RemoteAreaFilterToggle } from './RemoteAreaFilterToggle'

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
  const [excludeRemoteAreas, setExcludeRemoteAreas] = useState(false)
  const visibleAddresses = excludeRemoteAreas
    ? addresses.filter((address) => !address.isRemote)
    : addresses

  return (
    <>
      <RemoteAreaFilterToggle
        excludeRemoteAreas={excludeRemoteAreas}
        setExcludeRemoteAreas={setExcludeRemoteAreas}
      />
      <RadioGroup legend="배송지 선택" legendClassName="sr-only">
        <For each={visibleAddresses}>
          {(address) => (
            <AddressField
              key={address.id}
              address={address}
              selected={address.id === selectedAddressId}
              onSelect={onSelectAddress}
            />
          )}
        </For>
      </RadioGroup>
    </>
  )
}
