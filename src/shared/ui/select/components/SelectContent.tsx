import type { ToggleEvent } from 'react'
import {
  type Ref,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
} from 'react'

import { PopoverCapability } from '../lib/popoverCapability'
import { useSelectContext } from '../lib/SelectContext'
import { useNativePopoverSync } from '../lib/useNativePopoverSync'
import type { SelectContentProps } from '../types'

type SelectContentComponentProps = SelectContentProps & {
  readonly ref?: Ref<HTMLDivElement>
}

export function SelectContent({
  children,
  hidden: consumerHidden,
  onBeforeToggle,
  onToggle,
  popover: consumerPopover,
  ref,
  ...contentProps
}: SelectContentComponentProps) {
  const select = useSelectContext('Content')
  const contentRef = useRef<HTMLDivElement | null>(null)
  const supportsNativePopover = useSyncExternalStore(
    () => PopoverCapability.subscribe(),
    () => PopoverCapability.getSnapshot(),
    () => PopoverCapability.getServerSnapshot(),
  )

  useImperativeHandle(ref, () => contentRef.current as HTMLDivElement, [])

  useNativePopoverSync({
    contentRef,
    consumerHidden,
    select,
    supportsNativePopover,
  })

  function handleBeforeToggle(event: ToggleEvent<HTMLDivElement>) {
    onBeforeToggle?.(event)

    if (!event.defaultPrevented) {
      return
    }

    if (event.newState === 'open') {
      select.close()
      return
    }

    if (!select.open) {
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
      id={select.listboxId}
      ref={contentRef}
      role="listbox"
      hidden={
        consumerHidden === true || (!supportsNativePopover && !select.open)
      }
      onBeforeToggle={handleBeforeToggle}
      onToggle={handleToggle}
      popover={
        supportsNativePopover ? (consumerPopover ?? 'auto') : consumerPopover
      }
    >
      {children}
    </div>
  )
}
