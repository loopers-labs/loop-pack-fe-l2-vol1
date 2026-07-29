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

import { useState, type KeyboardEvent, type MouseEvent } from 'react'

export interface SelectOptionState {
  selected: boolean
  highlighted: boolean
  disabled: boolean
}

// 하이라이트는 열려 있을 때만 존재한다 — 닫힘+하이라이트 조합을 타입으로 봉쇄한다.
type OpenState = { isOpen: false } | { isOpen: true; highlightedIndex: number }

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
  const [openState, setOpenState] = useState<OpenState>({ isOpen: false })

  const isOpen = openState.isOpen
  // 파생값 — 렌더 중 계산. items가 열려 있는 동안 줄어들어 인덱스가 범위를
  // 벗어나면 -1로 클램프해 키보드 내비게이션이 좌초하지 않게 한다.
  const highlightedIndex =
    openState.isOpen && openState.highlightedIndex < items.length
      ? openState.highlightedIndex
      : -1

  const selectedIndex =
    value === null
      ? -1
      : items.findIndex((item) => getItemId(item) === getItemId(value))

  const isDisabledAt = (index: number) => {
    const item = items[index]
    return item !== undefined && (isItemDisabled?.(item) ?? false)
  }

  const canSelectAt = (index: number) =>
    index >= 0 && index < items.length && !isDisabledAt(index)

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
    setOpenState({ isOpen: true, highlightedIndex: initial })
  }

  const close = () => setOpenState({ isOpen: false })

  const selectAt = (index: number) => {
    if (!canSelectAt(index)) return
    onChange(items[index])
    close()
  }

  const moveHighlight = (step: 1 | -1) => {
    // 하이라이트가 없으면 이동 방향의 끝에서 시작한다 (↓는 처음부터, ↑는 끝에서부터).
    const edgeStart = step === 1 ? 0 : items.length - 1
    const from = highlightedIndex === -1 ? edgeStart : highlightedIndex + step
    const next = findEnabledIndex(from, step)
    if (next !== -1) setOpenState({ isOpen: true, highlightedIndex: next })
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
        // 선택할 수 있는 하이라이트가 없으면(전 옵션 품절 등) 네이티브 select처럼 닫는다.
        if (canSelectAt(highlightedIndex)) selectAt(highlightedIndex)
        else close()
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
    /** 트리거 버튼에 스프레드 — 클릭 토글 + 키보드(열기·이동·선택·닫기) + blur 닫기 */
    getToggleProps: () => ({
      type: 'button' as const,
      onClick: () => (isOpen ? close() : open()),
      onKeyDown: handleTriggerKeyDown,
      // 다른 곳을 클릭/Tab하면 닫는다 — 페이지에 셀렉트가 여러 개일 때 동시 열림 방지.
      onBlur: () => close(),
    }),
    /** 각 옵션 요소에 스프레드 — 클릭 선택, 호버 하이라이트 */
    getOptionProps: (index: number) => ({
      onClick: () => selectAt(index),
      // 옵션을 누르는 순간 트리거가 blur로 먼저 닫혀 클릭이 증발하는 것을 막는다.
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onMouseEnter: () => {
        if (!isDisabledAt(index)) {
          setOpenState({ isOpen: true, highlightedIndex: index })
        }
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
