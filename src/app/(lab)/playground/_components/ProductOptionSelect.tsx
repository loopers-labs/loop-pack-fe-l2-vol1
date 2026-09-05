'use client'

// 옵션 UI 2 — 썸네일 + 할인가 옵션 (docs/images/select1.png)
// 같은 useSelect 훅, 생김새만 다르다. 선택된 "객체"의 가격으로 결제 금액을 계산한다.

import { useState } from 'react'
import { useSelect } from '@/shared/ui/select'
import { formatWon } from '@/shared/lib/formatWon'

interface AmpouleOption {
  id: string
  name: string
  discountRate: number
  price: number
  todayDream: boolean
  soldOut: boolean
}

const AMPOULE_OPTIONS: AmpouleOption[] = [
  {
    id: 'a1',
    name: '그로우턴 앰플 100ml기획(+100ml)',
    discountRate: 2,
    price: 38800,
    todayDream: true,
    soldOut: false,
  },
  {
    id: 'a2',
    name: '그로우턴 앰플 130ml기획(+30ml)',
    discountRate: 2,
    price: 33800,
    todayDream: true,
    soldOut: false,
  },
  {
    id: 'a3',
    name: '그로우턴 앰플 200ml 더블기획',
    discountRate: 5,
    price: 52000,
    todayDream: false,
    soldOut: true,
  },
]

export default function ProductOptionSelect() {
  const [selectedOption, setSelectedOption] = useState<AmpouleOption | null>(
    null,
  )

  const select = useSelect({
    items: AMPOULE_OPTIONS,
    value: selectedOption,
    onChange: setSelectedOption,
    getItemId: (option) => option.id,
    isItemDisabled: (option) => option.soldOut,
  })

  return (
    <div style={{ border: '1px solid #d9dee5', borderRadius: 12 }}>
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
          fontWeight: 600,
          color: '#18212e',
          cursor: 'pointer',
        }}
      >
        <span>
          {selectedOption ? selectedOption.name : '옵션을 선택해 주세요'}
        </span>
        <span>{select.isOpen ? '▲' : '▼'}</span>
      </button>

      {select.isOpen && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {AMPOULE_OPTIONS.map((option, index) => {
            const { selected, highlighted, disabled } =
              select.getOptionState(index)
            return (
              <li
                key={option.id}
                {...select.getOptionProps(index)}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderTop: '1px solid #eef1f4',
                  background: highlighted ? '#fff7f4' : 'none',
                  opacity: disabled ? 0.45 : 1,
                  outline: selected ? '2px solid #ff6b4a' : 'none',
                  outlineOffset: -2,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 72,
                    borderRadius: 6,
                    background: 'linear-gradient(160deg, #ffd9c4, #ff9c73)',
                  }}
                />
                <div>
                  <div style={{ color: '#18212e' }}>{option.name}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                    <b style={{ color: '#e8503a' }}>{option.discountRate}%</b>
                    <b style={{ color: '#18212e' }}>
                      {formatWon(option.price)}
                    </b>
                    {disabled ? (
                      <span style={{ color: '#8794a3', fontSize: 13 }}>
                        품절
                      </span>
                    ) : (
                      option.todayDream && (
                        <span
                          style={{
                            background: '#fdeef3',
                            color: '#e0447a',
                            fontSize: 12,
                            padding: '2px 6px',
                            borderRadius: 4,
                            alignSelf: 'center',
                          }}
                        >
                          오늘드림
                        </span>
                      )
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {selectedOption && (
        <p
          style={{
            margin: 0,
            padding: '12px 18px',
            borderTop: '1px solid #eef1f4',
            fontSize: 14,
            color: '#5a6675',
          }}
        >
          결제 예상 금액 <b>{formatWon(selectedOption.price)}</b>
          {selectedOption.todayDream && ' · 오늘드림 가능'}
        </p>
      )}
    </div>
  )
}
