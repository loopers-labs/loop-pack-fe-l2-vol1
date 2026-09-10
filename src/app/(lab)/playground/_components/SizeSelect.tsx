'use client'

// 옵션 UI 1 — 사이즈 선택 (docs/images/select3.png)
// mock 백엔드(/api/products)의 재고를 그대로 쓴다: stock 0 = 품절 → 키보드 이동에서 스킵.

import { useEffect, useState } from 'react'
import { useSelect } from '@/shared/ui/select'

interface SizeOption {
  value: number
  stock: number
}

interface ProductsResponse {
  products: Array<{ id: string; name: string; sizes: SizeOption[] }>
}

// 로딩·실패·성공은 동시에 성립할 수 없다 — boolean 조합 대신 union으로 모델링.
type SizesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; sizes: SizeOption[] }

export default function SizeSelect() {
  const [sizesState, setSizesState] = useState<SizesState>({
    status: 'loading',
  })
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/products', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<ProductsResponse>
      })
      .then((body) => {
        const withSizes = body.products.find((p) => p.sizes.length > 0)
        setSizesState({ status: 'ready', sizes: withSizes?.sizes ?? [] })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setSizesState({ status: 'error' })
      })
    return () => controller.abort()
  }, [])

  const sizes = sizesState.status === 'ready' ? sizesState.sizes : []

  const select = useSelect({
    items: sizes,
    value: selectedSize,
    onChange: setSelectedSize,
    getItemId: (size) => size.value,
    isItemDisabled: (size) => size.stock === 0,
  })

  if (sizesState.status === 'loading') {
    return <p style={{ color: '#8794a3' }}>사이즈 불러오는 중…</p>
  }
  if (sizesState.status === 'error') {
    return <p style={{ color: '#c0392b' }}>사이즈를 불러오지 못했어요.</p>
  }
  // 빈 배열이면 눌리는데 아무것도 안 열리는 트리거가 남는다 — 셀렉트 자체를 렌더하지 않는다.
  if (sizes.length === 0) {
    return <p style={{ color: '#8794a3' }}>등록된 사이즈가 없어요.</p>
  }

  return (
    <div style={{ border: '1px solid #d9dee5', borderRadius: 8 }}>
      <button
        {...select.getToggleProps()}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          font: 'inherit',
          color: selectedSize ? '#18212e' : '#8794a3',
          cursor: 'pointer',
        }}
      >
        <span>{selectedSize ? `사이즈 ${selectedSize.value}` : '사이즈'}</span>
        <span>{select.isOpen ? '▲' : '▼'}</span>
      </button>

      {select.isOpen && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {sizes.map((size, index) => {
            const { selected, highlighted, disabled } =
              select.getOptionState(index)
            return (
              <li
                key={size.value}
                {...select.getOptionProps(index)}
                style={{
                  padding: '14px 16px',
                  borderTop: '1px solid #eef1f4',
                  background: highlighted ? '#f4f7fb' : 'none',
                  color: disabled ? '#c3cad3' : '#18212e',
                  fontWeight: selected ? 700 : 400,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <div style={{ fontSize: 18 }}>
                  {size.value}
                  {disabled && (
                    <span style={{ marginLeft: 8, fontSize: 13 }}>품절</span>
                  )}
                </div>
                {!disabled && (
                  <div style={{ color: '#2f5bea', fontSize: 14, marginTop: 4 }}>
                    🚚 내일(토) 도착보장
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {selectedSize && (
        <p
          style={{
            margin: 0,
            padding: '10px 16px',
            borderTop: '1px solid #eef1f4',
            fontSize: 14,
            color: '#5a6675',
          }}
        >
          선택한 사이즈 {selectedSize.value} — 남은 재고 {selectedSize.stock}개
        </p>
      )}
    </div>
  )
}
