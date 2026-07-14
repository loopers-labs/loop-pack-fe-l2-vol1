import type { KeyboardEvent, MouseEvent } from 'react'

import { useSelectContext } from '../lib/SelectContext'
import { TriggerKeyboard } from '../lib/TriggerKeyboard'
import type { SelectTriggerProps } from '../types'

export function SelectTrigger({
  children,
  onClick,
  onKeyDown,
  ...buttonProps
}: SelectTriggerProps) {
  const select = useSelectContext('Trigger')

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
      role="combobox"
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  )
}
