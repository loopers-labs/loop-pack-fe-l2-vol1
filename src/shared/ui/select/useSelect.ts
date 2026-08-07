'use client'

import { useEffect, useRef, useState } from 'react'

// Select (Headless) — 4주차 1단계
//
// 로직(열기/닫기·선택값·키보드·비활성 스킵)만 제공한다. JSX는 없다 — 생김새는 사용처가 그린다.
// value/onChange는 부모가 소유(컨트롤드)한다: 옵션 객체 전체를 그대로 주고받아야
// 가격·배송 계산에 바로 쓸 수 있기 때문 (문자열 value였다면 호출부가 다시 options에서 찾아야 함).

export interface SelectOptionLike {
  id: string
  disabled?: boolean
}

interface UseSelectParams<T extends SelectOptionLike> {
  options: T[]
  value: T | null
  onChange: (option: T) => void
}

export interface OptionState {
  selected: boolean
  highlighted: boolean
  disabled: boolean
}

export function useSelect<T extends SelectOptionLike>({
  options,
  value,
  onChange,
}: UseSelectParams<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)

  // 인라인 펼침 리스트라 팝오버 위치 계산은 필요 없지만, 바깥 클릭 닫기는
  // 리스트박스 기본 동작이라 여기 포함한다 (요구사항엔 없지만 값싸게 얹을 수 있음).
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // options가 줄어들며(예: 재조회) highlightedIndex가 범위를 벗어날 수 있다 —
  // state를 effect로 다시 동기화하는 대신, 읽는 시점에 매번 파생시킨다("derive during
  // render") — 안 그러면 Enter를 눌렀을 때 options[highlightedIndex]가 undefined라 터진다.
  const safeHighlightedIndex =
    highlightedIndex < options.length ? highlightedIndex : -1

  const close = () => setIsOpen(false)

  const open = () => {
    const selectedIndex = value
      ? options.findIndex((option) => option.id === value.id)
      : -1
    const isSelectedEnabled =
      selectedIndex >= 0 && !options[selectedIndex].disabled
    setHighlightedIndex(
      isSelectedEnabled ? selectedIndex : findNextEnabledIndex(options, -1, 1),
    )
    setIsOpen(true)
  }

  const toggle = () => (isOpen ? close() : open())

  const highlight = (index: number) => {
    if (!options[index]?.disabled) setHighlightedIndex(index)
  }

  const selectOption = (option: T) => {
    if (option.disabled) return
    onChange(option)
    close()
  }

  const moveHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((current) =>
      findNextEnabledIndex(options, current, direction),
    )
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) open()
        else moveHighlight(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) open()
        else moveHighlight(-1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!isOpen) open()
        else if (safeHighlightedIndex >= 0)
          selectOption(options[safeHighlightedIndex])
        break
      case 'Escape':
        if (isOpen) {
          event.preventDefault()
          close()
        }
        break
      default:
        break
    }
  }

  const getOptionState = (option: T, index: number): OptionState => ({
    selected: value?.id === option.id,
    highlighted: index === safeHighlightedIndex,
    disabled: Boolean(option.disabled),
  })

  return {
    isOpen,
    highlightedIndex: safeHighlightedIndex,
    rootRef,
    open,
    close,
    toggle,
    highlight,
    selectOption,
    getOptionState,
    triggerProps: {
      type: 'button' as const,
      onClick: toggle,
      onKeyDown,
      'aria-expanded': isOpen,
      'aria-haspopup': 'listbox' as const,
    },
    listProps: {
      role: 'listbox' as const,
    },
  }
}

// 현재 인덱스에서 방향대로 훑되, 비활성(disabled) 옵션은 건너뛴다.
// 끝까지 가도 활성 옵션이 없으면 원래 위치를 유지한다(경계에서 튕겨나가지 않음).
function findNextEnabledIndex<T extends SelectOptionLike>(
  options: T[],
  current: number,
  direction: 1 | -1,
): number {
  const count = options.length
  if (count === 0) return -1

  let index = current
  for (let step = 0; step < count; step++) {
    index = index === -1 ? (direction === 1 ? 0 : count - 1) : index + direction
    if (index < 0 || index >= count) return current
    if (!options[index].disabled) return index
  }
  return current
}
