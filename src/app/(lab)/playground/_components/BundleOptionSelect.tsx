'use client'

// 옵션 UI 3 — 묶음 가격 + 무료배송 옵션 (docs/images/select2.png)
// 같은 useSelect 훅. 선택된 객체의 수량·가격·배송 정보로 개당가와 배송비를 계산한다.

import { useState } from 'react'
import { useSelect } from '@/shared/ui/select'
import { formatWon } from '@/shared/lib/formatWon'

interface BundleOption {
  id: string
  label: string
  price: number
  unitCount: number
  freeShipping: boolean
  soldOut: boolean
}

const BUNDLE_OPTIONS: BundleOption[] = [
  {
    id: 'b1',
    label: '[최대할인] 베이글 5+5개',
    price: 21000,
    unitCount: 10,
    freeShipping: true,
    soldOut: false,
  },
  {
    id: 'b2',
    label: '베이글 1개',
    price: 4200,
    unitCount: 1,
    freeShipping: false,
    soldOut: false,
  },
  {
    id: 'b3',
    label: '[한정] 베이글 3+1개',
    price: 12600,
    unitCount: 4,
    freeShipping: false,
    soldOut: true,
  },
]

const SHIPPING_FEE = 3000

// 순수 함수 — 렌더 스코프에 둘 이유가 없다.
const pricePerUnit = (bundle: BundleOption) =>
  Math.round(bundle.price / bundle.unitCount)

export default function BundleOptionSelect() {
  const [selectedBundle, setSelectedBundle] = useState<BundleOption | null>(
    null,
  )

  const select = useSelect({
    items: BUNDLE_OPTIONS,
    value: selectedBundle,
    onChange: setSelectedBundle,
    getItemId: (bundle) => bundle.id,
    isItemDisabled: (bundle) => bundle.soldOut,
  })

  // 파생값 — 선택된 "객체"에서 렌더 중 계산한다.
  const totalWithShipping = selectedBundle
    ? selectedBundle.price + (selectedBundle.freeShipping ? 0 : SHIPPING_FEE)
    : null

  return (
    <div style={{ border: '1px solid #e5e0d8', borderRadius: 12 }}>
      <button
        {...select.getToggleProps()}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 18px',
          background: 'none',
          border: 'none',
          font: 'inherit',
          fontWeight: 700,
          color: '#2b2620',
          cursor: 'pointer',
        }}
      >
        <span>{selectedBundle ? selectedBundle.label : '옵션 선택'}</span>
        <span>{select.isOpen ? '▲' : '▼'}</span>
      </button>

      {select.isOpen && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {BUNDLE_OPTIONS.map((bundle, index) => {
            const { selected, highlighted, disabled } =
              select.getOptionState(index)
            return (
              <li
                key={bundle.id}
                {...select.getOptionProps(index)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 18px',
                  borderTop: '1px solid #f0ece5',
                  background: highlighted ? '#fdf8f1' : 'none',
                  opacity: disabled ? 0.45 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <div>
                  <div
                    style={{
                      color: '#2b2620',
                      fontWeight: selected ? 700 : 400,
                    }}
                  >
                    {bundle.label}
                    {disabled && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 13,
                          color: '#a39a8d',
                        }}
                      >
                        품절
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b style={{ fontSize: 18, color: '#2b2620' }}>
                      {formatWon(bundle.price)}
                    </b>{' '}
                    <span style={{ color: '#e8590c', fontSize: 14 }}>
                      (1개당 {formatWon(pricePerUnit(bundle))})
                    </span>
                  </div>
                </div>
                {bundle.freeShipping && (
                  <span
                    style={{
                      border: '1.5px solid #e8590c',
                      color: '#e8590c',
                      borderRadius: 999,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    무료배송
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {selectedBundle && totalWithShipping !== null && (
        <p
          style={{
            margin: 0,
            padding: '12px 18px',
            borderTop: '1px solid #f0ece5',
            fontSize: 14,
            color: '#6b6155',
          }}
        >
          배송비{' '}
          {selectedBundle.freeShipping ? '무료' : formatWon(SHIPPING_FEE)} 포함{' '}
          <b>{formatWon(totalWithShipping)}</b> (1개당{' '}
          {formatWon(pricePerUnit(selectedBundle))})
        </p>
      )}
    </div>
  )
}
