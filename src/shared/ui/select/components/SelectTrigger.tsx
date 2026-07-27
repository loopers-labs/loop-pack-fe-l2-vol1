import type { Ref } from 'react'
import { type KeyboardEvent, type MouseEvent, useImperativeHandle } from 'react'

import { useSelectContext } from '../lib/SelectContext'
import { useSelectTriggerRef } from '../lib/SelectTriggerRefContext'
import { TriggerKeyboard } from '../lib/TriggerKeyboard'
import type { SelectTriggerProps } from '../types'

type SelectTriggerComponentProps = SelectTriggerProps & {
  readonly ref?: Ref<HTMLButtonElement>
}

export function SelectTrigger({
  children,
  onClick,
  onKeyDown,
  ref,
  ...buttonProps
}: SelectTriggerComponentProps) {
  const select = useSelectContext('Trigger')
  const triggerRef = useSelectTriggerRef('Trigger')

  useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement, [
    triggerRef,
  ])

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    event.preventDefault()
    select.toggleOpen()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event)

    if (event.defaultPrevented) {
      return
    }

    TriggerKeyboard.handleKeyDown(event, select)
  }

  return (
    <button
      {...buttonProps}
      aria-activedescendant={
        select.open ? select.highlightedOptionElementId : undefined
      }
      aria-controls={select.listboxId}
      aria-expanded={select.open}
      aria-haspopup="listbox"
      ref={triggerRef}
      role="combobox"
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  )
}
