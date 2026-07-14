import { type ToggleEvent, useLayoutEffect, useSyncExternalStore } from 'react'

import { useSelectContext } from '../lib/SelectContext'
import type { SelectContentProps } from '../types'

function subscribeToPopoverCapability() {
  return () => undefined
}

function getPopoverCapabilitySnapshot() {
  return (
    typeof HTMLElement !== 'undefined' &&
    typeof HTMLButtonElement !== 'undefined' &&
    'popover' in HTMLElement.prototype &&
    typeof HTMLElement.prototype.showPopover === 'function' &&
    typeof HTMLElement.prototype.hidePopover === 'function' &&
    'popoverTargetElement' in HTMLButtonElement.prototype &&
    typeof CSS !== 'undefined' &&
    CSS.supports('position-area: block-end') &&
    CSS.supports('width: anchor-size(width)') &&
    CSS.supports('position-try-fallbacks: flip-block')
  )
}

function getServerPopoverCapabilitySnapshot() {
  return false
}

export function SelectContent({
  children,
  hidden: consumerHidden,
  onBeforeToggle,
  onToggle,
  popover: consumerPopover,
  ...contentProps
}: SelectContentProps) {
  const select = useSelectContext('Content')
  const highlightedOptionElementId = select.highlightedOptionElementId
  const listboxId = select.listboxId
  const open = select.open
  const supportsNativePopover = useSyncExternalStore(
    subscribeToPopoverCapability,
    getPopoverCapabilitySnapshot,
    getServerPopoverCapabilitySnapshot,
  )

  useLayoutEffect(() => {
    if (!supportsNativePopover) {
      return
    }

    const contentElement = document.getElementById(listboxId)

    if (!(contentElement instanceof HTMLDivElement)) {
      return
    }

    const nativeOpen = contentElement.matches(':popover-open')

    if ((!open || consumerHidden === true) && nativeOpen) {
      contentElement.hidePopover()
      return
    }

    if (!open || consumerHidden === true || nativeOpen) {
      return
    }

    const triggerElement = Array.from(
      document.querySelectorAll('[aria-controls]'),
    ).find((candidate) => candidate.getAttribute('aria-controls') === listboxId)

    if (!(triggerElement instanceof HTMLButtonElement)) {
      return
    }

    triggerElement.popoverTargetElement = contentElement
    contentElement.showPopover({ source: triggerElement })
  }, [consumerHidden, listboxId, open, supportsNativePopover])

  useLayoutEffect(() => {
    if (!open || highlightedOptionElementId === undefined) {
      return
    }

    const highlightedElement = document.getElementById(
      highlightedOptionElementId,
    )

    if (!(highlightedElement instanceof HTMLElement)) {
      return
    }

    highlightedElement.scrollIntoView({ block: 'nearest' })
  }, [highlightedOptionElementId, open])

  function handleBeforeToggle(event: ToggleEvent<HTMLDivElement>) {
    onBeforeToggle?.(event)

    if (!event.defaultPrevented) {
      return
    }

    if (event.newState === 'open') {
      select.close()
      return
    }

    if (!open) {
      select.openSelected()
    }
  }

  function handleToggle(event: ToggleEvent<HTMLDivElement>) {
    onToggle?.(event)

    if (event.newState === 'closed') {
      select.close()
      return
    }

    if (!select.open) {
      select.openSelected()
    }
  }

  return (
    <div
      {...contentProps}
      id={listboxId}
      role="listbox"
      popover={
        supportsNativePopover ? (consumerPopover ?? 'auto') : consumerPopover
      }
      hidden={consumerHidden === true || (!supportsNativePopover && !open)}
      onBeforeToggle={handleBeforeToggle}
      onToggle={handleToggle}
    >
      {children}
    </div>
  )
}
