// 배송지 — 접기/펼치기와 선택 요약은 스스로 책임진다.

import { useState } from 'react'
import type { Address } from './types'
import { useCheckout } from './context'

// 공유 상태(배송지 선택)는 Context 에서 읽고,
// 실제 선택 동작(onSelectAddress)은 AddressForm → AddressField 로 통과시킨다.
export function DeliveryAddress() {
  const { addresses, selectedAddressId, setSelectedAddressId: onSelectAddress } = useCheckout()
  const [expanded, setExpanded] = useState(false)
  const selected = addresses.find((a) => a.id === selectedAddressId)!
  return (
    <div className="section">
      <div className="row between">
        <h2>배송지</h2>
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : '변경'}
        </button>
      </div>
      {expanded ? (
        <AddressForm
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddress={onSelectAddress}
        />
      ) : (
        <p className="addr-summary">
          {selected.label} · {selected.recipient} ({selected.detail})
        </p>
      )}
    </div>
  )
}

// '도서산간 제외' 필터는 스스로 책임진다.
// 선택 동작(onSelectAddress)은 그대로 AddressField 로 통과시킨다.
function AddressForm({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Address[]
  selectedAddressId: string
  onSelectAddress: (id: string) => void
}) {
  const [onlyNear, setOnlyNear] = useState(false)
  const list = onlyNear ? addresses.filter((a) => !a.isRemote) : addresses
  return (
    <>
      <label className="filter">
        <input type="checkbox" checked={onlyNear} onChange={(e) => setOnlyNear(e.target.checked)} />
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
  )
}

function AddressField({
  address,
  selected,
  onSelect,
}: {
  address: Address
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <label className="addr">
      <input type="radio" checked={selected} onChange={() => onSelect(address.id)} />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        {address.isRemote ? ' · 도서산간' : ''}
      </span>
    </label>
  )
}
