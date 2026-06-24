import type { Address } from '@/entities/market'

export function SelectedAddress({ selected }: { selected: Address }) {
  return (
    <p className="m-0 text-sm text-(--text-h)">
      {selected.label} · {selected.recipient} ({selected.detail})
    </p>
  )
}
