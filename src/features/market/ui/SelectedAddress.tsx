import type { Address } from '@/entities/market'

export function SelectedAddress({
  selectedAddress,
}: {
  selectedAddress: Address
}) {
  return (
    <p className="m-0 text-sm text-(--text-h)">
      {selectedAddress.label} · {selectedAddress.recipient} (
      {selectedAddress.detail})
    </p>
  )
}
