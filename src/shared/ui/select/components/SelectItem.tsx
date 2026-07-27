import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'

import { useSelectContext } from '../lib/SelectContext'
import type {
  SelectItemProps,
  SelectOption,
  SelectOptionRenderState,
} from '../types'

export function SelectItem<TOption extends SelectOption>({
  children,
  option,
  onClick,
  onKeyDown,
  onPointerEnter,
  ...itemProps
}: SelectItemProps<TOption>) {
  const select = useSelectContext('Item')
  const state = {
    option,
    selected: select.selectedOption?.id === option.id,
    highlighted: select.highlightedId === option.id,
    disabled: option.disabled === true,
  } satisfies SelectOptionRenderState<TOption>
  const content = children?.(state) ?? option.label

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (state.disabled) {
      return
    }

    onPointerEnter?.(event)

    if (!event.defaultPrevented) {
      select.setHighlighted(option)
    }
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (state.disabled) {
      event.preventDefault()
      return
    }

    onClick?.(event)

    if (!event.defaultPrevented) {
      select.selectOption(option)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (state.disabled) {
      return
    }

    onKeyDown?.(event)

    if (event.defaultPrevented) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      select.selectOption(option)
    }
  }

  return (
    <div
      {...itemProps}
      aria-disabled={state.disabled}
      aria-selected={state.selected}
      data-disabled={state.disabled}
      data-highlighted={state.highlighted}
      data-selected={state.selected}
      id={select.getOptionElementId(option)}
      role="option"
      tabIndex={-1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
    >
      {content}
    </div>
  )
}
