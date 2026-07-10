'use client'

// Select (Headless) — 로직 한 벌, 생김새는 사용처가.
//
// 설계 근거:
// - 상태(isOpen·highlightedIndex)와 prop getter만 노출한다. 마크업·스타일 판단은
//   전부 사용처의 것 — 같은 훅으로 서로 다른 옵션 UI를 렌더하기 위한 경계다.
// - value는 문자열이 아니라 옵션 객체 전체(Item). onChange가 가격·배송 계산에
//   쓸 객체를 그대로 돌려준다.
// - 품절 같은 도메인 판단은 isItemDisabled 콜백으로 사용처가 내린다.
//   훅은 "disabled면 건너뛰고 선택 불가"라는 동작만 책임진다.

import { useState, type KeyboardEvent } from 'react'

export interface SelectOptionState {
  selected: boolean
  highlighted: boolean
  disabled: boolean
}

interface UseSelectParams<Item> {
  items: Item[]
  value: Item | null
  onChange: (item: Item) => void
  /** selected 비교용 식별자 — 객체 참조가 아니라 id로 비교해야 refetch 후에도 유지된다 */
  getItemId: (item: Item) => string | number
  isItemDisabled?: (item: Item) => boolean
}

export function useSelect<Item>({
  items,
  value,
  onChange,
  getItemId,
  isItemDisabled,
}: UseSelectParams<Item>) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // 파생값 — 렌더 중 계산한다. items가 refetch로 바뀌어도 동기화 코드가 필요 없다.
  const selectedIndex =
    value === null
      ? -1
      : items.findIndex((item) => getItemId(item) === getItemId(value))

  const isDisabledAt = (index: number) => {
    const item = items[index]
    return item !== undefined && (isItemDisabled?.(item) ?? false)
  }

  // from부터 step 방향으로 첫 활성 옵션을 찾는다. 없으면 -1 (경계에서 멈춤, 순환 없음).
  const findEnabledIndex = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < items.length; i += step) {
      if (!isDisabledAt(i)) return i
    }
    return -1
  }

  const open = () => {
    // 열릴 때 하이라이트 시작점: 선택된 옵션 → 없으면 첫 활성 옵션.
    const initial =
      selectedIndex >= 0 && !isDisabledAt(selectedIndex)
        ? selectedIndex
        : findEnabledIndex(0, 1)
    setHighlightedIndex(initial)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const selectAt = (index: number) => {
    if (index < 0 || index >= items.length || isDisabledAt(index)) return
    onChange(items[index])
    close()
  }

  const moveHighlight = (step: 1 | -1) => {
    // 하이라이트가 없으면 이동 방향의 끝에서 시작한다 (↓는 처음부터, ↑는 끝에서부터).
    const edgeStart = step === 1 ? 0 : items.length - 1
    const from = highlightedIndex === -1 ? edgeStart : highlightedIndex + step
    const next = findEnabledIndex(from, step)
    if (next !== -1) setHighlightedIndex(next)
  }

  // 포커스 관리는 이번 주 범위 밖 — 키보드는 트리거 버튼에 머문 채 처리한다.
  const handleTriggerKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault()
        open()
      }
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveHighlight(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveHighlight(-1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        selectAt(highlightedIndex)
        break
      case 'Escape':
        event.preventDefault()
        close()
        break
    }
  }

  return {
    isOpen,
    highlightedIndex,
    /** 트리거 버튼에 스프레드 — 클릭 토글 + 키보드(열기·이동·선택·닫기) */
    getToggleProps: () => ({
      type: 'button' as const,
      onClick: () => (isOpen ? close() : open()),
      onKeyDown: handleTriggerKeyDown,
    }),
    /** 각 옵션 요소에 스프레드 — 클릭 선택, 호버 하이라이트 */
    getOptionProps: (index: number) => ({
      onClick: () => selectAt(index),
      onMouseEnter: () => {
        if (!isDisabledAt(index)) setHighlightedIndex(index)
      },
    }),
    /** 사용처가 스타일 판단에 쓰는 옵션별 상태 */
    getOptionState: (index: number): SelectOptionState => ({
      selected: index === selectedIndex,
      highlighted: index === highlightedIndex,
      disabled: isDisabledAt(index),
    }),
  }
}
