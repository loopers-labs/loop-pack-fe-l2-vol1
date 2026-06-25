import { Show } from '@ilokesto/utilinent'

import type { Address } from '@/entities/market'
import { Label } from '@/shared/ui'

type AddressFieldProps = {
  address: Address
  selected: boolean
  onSelect: (id: string) => void
}

export function AddressField({
  address,
  selected,
  onSelect,
}: AddressFieldProps) {
  return (
    <Label>
      <input
        type="radio"
        checked={selected}
        onChange={() => {
          onSelect(address.id)
        }}
      />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        <Show when={address.isRemote}> · 도서산간</Show>
      </span>
    </Label>
  )
}
