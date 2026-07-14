import type { KeyboardEvent } from 'react'

import type { HighlightDirection, SelectContextValue } from '../types'

export class TriggerKeyboard {
  private constructor() {}

  static handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    select: SelectContextValue,
  ) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        TriggerKeyboard.handleArrowKey(select, 'forward')
        return
      case 'ArrowUp':
        event.preventDefault()
        TriggerKeyboard.handleArrowKey(select, 'backward')
        return
      case 'Home':
        event.preventDefault()
        select.openFirst()
        return
      case 'End':
        event.preventDefault()
        select.openLast()
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        TriggerKeyboard.handleConfirmKey(select)
        return
      case 'Escape':
        event.preventDefault()
        select.close()
        return
      case 'Tab':
        select.close()
        return
      default:
        return
    }
  }

  private static handleArrowKey(
    select: SelectContextValue,
    direction: HighlightDirection,
  ) {
    if (select.open) {
      select.moveHighlight(direction)
      return
    }

    if (direction === 'forward') {
      select.openFirst()
      return
    }

    select.openLast()
  }

  private static handleConfirmKey(select: SelectContextValue) {
    if (select.open) {
      select.selectHighlighted()
      return
    }

    select.openSelected()
  }
}
