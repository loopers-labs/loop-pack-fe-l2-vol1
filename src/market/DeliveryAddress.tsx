// 배송지 — 접기/펼치기와 선택 요약은 스스로 책임진다.

import { useState } from 'react'
import type { Address } from './types'
import { useCheckout } from './context'

export function DeliveryAddress() {
  const { selectedAddress } = useCheckout()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="section">
      <div className="row between">
        <h2>배송지</h2>
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : '변경'}
        </button>
      </div>
      {expanded ? (
        <AddressForm />
      ) : (
        <p className="addr-summary">
          {selectedAddress.label} · {selectedAddress.recipient} ({selectedAddress.detail})
        </p>
      )}
    </div>
  )
}

function AddressForm() {
  const { addresses } = useCheckout()
  const [onlyNear, setOnlyNear] = useState(false)
  const list = onlyNear ? addresses.filter((a) => !a.isRemote) : addresses
  return (
    <>
      <label className="filter">
        <input type="checkbox" checked={onlyNear} onChange={(e) => setOnlyNear(e.target.checked)} />
        도서산간 제외
      </label>
      {list.map((a) => (
        <AddressField key={a.id} address={a} />
      ))}
    </>
  )
}

function AddressField({ address }: { address: Address }) {
  const { selectedAddressId, setSelectedAddressId } = useCheckout()
  const selected = address.id === selectedAddressId
  return (
    <label className="addr">
      <input type="radio" checked={selected} onChange={() => setSelectedAddressId(address.id)} />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        {address.isRemote ? ' · 도서산간' : ''}
      </span>
    </label>
  )
}
