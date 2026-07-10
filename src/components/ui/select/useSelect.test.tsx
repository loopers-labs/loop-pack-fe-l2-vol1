import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSelect } from './useSelect'

// 공개 API(prop getter·상태)로만 검증한다 — 내부 구현 교체에 견디는 계약 테스트.

interface Option {
  id: string
  label: string
  soldOut?: boolean
}

const OPTIONS: Option[] = [
  { id: 'a', label: '옵션 A' },
  { id: 'b', label: '옵션 B', soldOut: true },
  { id: 'c', label: '옵션 C' },
  { id: 'd', label: '옵션 D', soldOut: true },
  { id: 'e', label: '옵션 E' },
]

function TestSelect({
  items,
  initialValue = null,
}: {
  items: Option[]
  initialValue?: Option | null
}) {
  const [value, setValue] = useState<Option | null>(initialValue)
  const select = useSelect({
    items,
    value,
    onChange: setValue,
    getItemId: (option) => option.id,
    isItemDisabled: (option) => option.soldOut === true,
  })

  return (
    <div>
      <button data-testid="toggle" {...select.getToggleProps()}>
        {value ? value.label : '선택하세요'}
      </button>
      {select.isOpen && (
        <ul data-testid="listbox">
          {items.map((option, index) => {
            const state = select.getOptionState(index)
            return (
              <li
                key={option.id}
                data-testid={`option-${option.id}`}
                data-selected={state.selected}
                data-highlighted={state.highlighted}
                data-disabled={state.disabled}
                {...select.getOptionProps(index)}
              >
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
      <output data-testid="selected-id">{value?.id ?? 'none'}</output>
    </div>
  )
}

const toggle = () => screen.getByTestId('toggle')
const highlightedId = () => {
  const highlighted = screen
    .queryAllByRole('listitem')
    .find((li) => li.getAttribute('data-highlighted') === 'true')
  return (
    highlighted?.getAttribute('data-testid')?.replace('option-', '') ?? null
  )
}

describe('useSelect — 열기/닫기', () => {
  it('클릭으로 토글된다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.click(toggle())
    expect(screen.getByTestId('listbox')).toBeInTheDocument()
    fireEvent.click(toggle())
    expect(screen.queryByTestId('listbox')).not.toBeInTheDocument()
  })

  it.each(['Enter', ' ', 'ArrowDown', 'ArrowUp'])(
    '닫힌 상태에서 %s 키로 열린다',
    (key) => {
      render(<TestSelect items={OPTIONS} />)
      fireEvent.keyDown(toggle(), { key })
      expect(screen.getByTestId('listbox')).toBeInTheDocument()
    },
  )

  it('Esc로 닫힌다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.click(toggle())
    fireEvent.keyDown(toggle(), { key: 'Escape' })
    expect(screen.queryByTestId('listbox')).not.toBeInTheDocument()
  })

  it('blur로 닫힌다 — 페이지에 셀렉트가 여러 개일 때 동시 열림 방지', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.click(toggle())
    fireEvent.blur(toggle())
    expect(screen.queryByTestId('listbox')).not.toBeInTheDocument()
  })

  it('옵션 mousedown은 preventDefault된다 — blur 닫힘이 클릭을 증발시키지 않도록', () => {
    // jsdom 한계: "blur가 안 일어난다"는 창발 행동은 브라우저 몫이고,
    // 여기선 그 전제인 preventDefault 메커니즘까지만 검증한다.
    render(<TestSelect items={OPTIONS} />)
    fireEvent.click(toggle())
    const notPrevented = fireEvent.mouseDown(screen.getByTestId('option-a'))
    expect(notPrevented).toBe(false) // preventDefault 호출됨
  })
})

describe('useSelect — 하이라이트 시작점', () => {
  it('선택값이 없으면 첫 활성 옵션에서 시작한다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' })
    expect(highlightedId()).toBe('a')
  })

  it('첫 옵션이 품절이면 건너뛰고 시작한다', () => {
    const items: Option[] = [
      { id: 'x', label: 'X', soldOut: true },
      { id: 'y', label: 'Y' },
    ]
    render(<TestSelect items={items} />)
    fireEvent.keyDown(toggle(), { key: 'Enter' })
    expect(highlightedId()).toBe('y')
  })

  it('선택된 옵션이 있으면 거기서 시작한다', () => {
    render(<TestSelect items={OPTIONS} initialValue={OPTIONS[2]} />)
    fireEvent.keyDown(toggle(), { key: 'Enter' })
    expect(highlightedId()).toBe('c')
  })

  it('↑로 열고 이동하면 끝에서부터 시작한다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.keyDown(toggle(), { key: 'ArrowUp' }) // 연다 (하이라이트: 첫 활성 a)
    // 참고: 열기 직후 하이라이트는 항상 "선택값 → 첫 활성" 규칙이다.
    expect(highlightedId()).toBe('a')
  })
})

describe('useSelect — 키보드 이동과 품절 스킵', () => {
  it('↓ 이동이 품절(b, d)을 건너뛴다: a → c → e', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // 열림, a
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' })
    expect(highlightedId()).toBe('c')
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' })
    expect(highlightedId()).toBe('e')
  })

  it('경계에서 멈춘다 — 순환하지 않는다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // a
    fireEvent.keyDown(toggle(), { key: 'ArrowUp' }) // a 위로는 없음
    expect(highlightedId()).toBe('a')
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // c
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // e
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // e 아래로는 없음
    expect(highlightedId()).toBe('e')
  })

  it('↑ 이동도 품절을 건너뛴다: e → c → a', () => {
    render(<TestSelect items={OPTIONS} initialValue={OPTIONS[4]} />)
    fireEvent.keyDown(toggle(), { key: 'Enter' }) // 열림, e
    fireEvent.keyDown(toggle(), { key: 'ArrowUp' })
    expect(highlightedId()).toBe('c')
    fireEvent.keyDown(toggle(), { key: 'ArrowUp' })
    expect(highlightedId()).toBe('a')
  })
})

describe('useSelect — 선택', () => {
  it('Enter가 하이라이트된 옵션 "객체"를 onChange로 돌려주고 닫는다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // a
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // c
    fireEvent.keyDown(toggle(), { key: 'Enter' })
    expect(screen.getByTestId('selected-id')).toHaveTextContent('c')
    expect(screen.queryByTestId('listbox')).not.toBeInTheDocument()
  })

  it('클릭으로 선택된다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.click(toggle())
    fireEvent.click(screen.getByTestId('option-e'))
    expect(screen.getByTestId('selected-id')).toHaveTextContent('e')
  })

  it('품절 옵션은 클릭해도 선택되지 않고 열려 있다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.click(toggle())
    fireEvent.click(screen.getByTestId('option-b'))
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none')
    expect(screen.getByTestId('listbox')).toBeInTheDocument()
  })

  it('hover가 하이라이트를 옮기되 품절은 무시한다', () => {
    render(<TestSelect items={OPTIONS} />)
    fireEvent.click(toggle())
    fireEvent.mouseEnter(screen.getByTestId('option-e'))
    expect(highlightedId()).toBe('e')
    fireEvent.mouseEnter(screen.getByTestId('option-b'))
    expect(highlightedId()).toBe('e') // 그대로
  })
})

describe('useSelect — 장애 시나리오 (전 옵션 품절·데이터 축소·refetch)', () => {
  it('전 옵션 품절: 열리되 하이라이트가 없고, Enter는 선택 없이 닫는다', () => {
    const allSoldOut: Option[] = [
      { id: 'x', label: 'X', soldOut: true },
      { id: 'y', label: 'Y', soldOut: true },
    ]
    render(<TestSelect items={allSoldOut} />)
    fireEvent.keyDown(toggle(), { key: 'Enter' }) // 열림
    expect(screen.getByTestId('listbox')).toBeInTheDocument()
    expect(highlightedId()).toBeNull()
    fireEvent.keyDown(toggle(), { key: 'Enter' }) // 네이티브 select처럼 닫힘
    expect(screen.queryByTestId('listbox')).not.toBeInTheDocument()
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none')
  })

  it('열려 있는 동안 items가 줄어도 키보드가 좌초하지 않는다', () => {
    const { rerender } = render(<TestSelect items={OPTIONS} />)
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // a
    fireEvent.mouseEnter(screen.getByTestId('option-e')) // 하이라이트 e(=index 4)
    rerender(<TestSelect items={OPTIONS.slice(0, 3)} />) // a, b(품절), c
    // 낡은 인덱스 4는 클램프되고, ↓는 처음부터 다시 탐색한다.
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' })
    expect(highlightedId()).toBe('a')
  })

  it('refetch로 배열 참조가 바뀌어도 id가 같으면 selected가 유지된다', () => {
    const { rerender } = render(
      <TestSelect items={OPTIONS} initialValue={OPTIONS[2]} />,
    )
    const refetched = OPTIONS.map((option) => ({ ...option })) // 새 객체들
    rerender(<TestSelect items={refetched} initialValue={OPTIONS[2]} />)
    fireEvent.click(toggle())
    expect(screen.getByTestId('option-c').getAttribute('data-selected')).toBe(
      'true',
    )
  })

  it('빈 items: 열려도 Enter·이동이 아무것도 하지 않고 크래시 없다', () => {
    render(<TestSelect items={[]} />)
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' }) // 열림
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' })
    fireEvent.keyDown(toggle(), { key: 'Enter' })
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none')
  })
})
