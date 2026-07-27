import { type RefObject, useLayoutEffect } from 'react'

import type { SelectContextValue } from '../types'
import { useSelectTriggerRef } from './SelectTriggerRefContext'

type UseNativePopoverSyncOptions = {
  readonly contentRef: RefObject<HTMLDivElement | null>
  readonly consumerHidden: boolean | undefined
  readonly supportsNativePopover: boolean
  readonly select: SelectContextValue
}

/**
 * SelectContent의 presentation infrastructure를 담당한다.
 *
 * - popover 상태를 React `open` 상태와 동기화한다.
 * - trigger 요소는 별도 `SelectTriggerRefContext`에서 바로 참조한다
 *   (querySelector 회피).
 * - highlighted option이 바뀌면 `scrollIntoView`로 가시 범위를 맞춘다.
 *
 * SelectContent 본문은 listbox DOM 렌더링과 consumer toggle 이벤트 처리만
 * 남기도록 이 훅으로 효과를 분리했다.
 */
export function useNativePopoverSync({
  contentRef,
  consumerHidden,
  supportsNativePopover,
  select,
}: UseNativePopoverSyncOptions) {
  const triggerRef = useSelectTriggerRef('Content')

  useLayoutEffect(() => {
    if (!supportsNativePopover) {
      return
    }

    const contentElement = contentRef.current

    if (!(contentElement instanceof HTMLDivElement)) {
      return
    }

    const nativeOpen = contentElement.matches(':popover-open')
    const shouldClose = !select.open || consumerHidden === true

    if (shouldClose && nativeOpen) {
      contentElement.hidePopover()
      return
    }

    if (shouldClose || nativeOpen) {
      return
    }

    const triggerElement = triggerRef.current

    if (!(triggerElement instanceof HTMLButtonElement)) {
      return
    }

    triggerElement.popoverTargetElement = contentElement
    contentElement.showPopover({ source: triggerElement })
  }, [
    consumerHidden,
    contentRef,
    select.open,
    supportsNativePopover,
    triggerRef,
  ])

  useLayoutEffect(() => {
    if (!select.open || select.highlightedOptionElementId === undefined) {
      return
    }

    const highlightedId = select.highlightedOptionElementId
    const contentElement = contentRef.current

    if (contentElement === null) {
      return
    }

    const highlightedElement = contentElement.querySelector(
      `[id="${CSS.escape(highlightedId)}"]`,
    )

    if (highlightedElement instanceof HTMLElement) {
      highlightedElement.scrollIntoView({ block: 'nearest' })
    }
  }, [contentRef, select.highlightedOptionElementId, select.open])
}
