import { useId, useState } from 'react'

import type {
  HighlightDirection,
  SelectContextValue,
  SelectOption,
  SelectRootProps,
} from '../types'
import { OptionNavigation } from './OptionNavigation'

export function useSelect<TOption extends SelectOption>({
  options,
  value,
  onChange,
}: Omit<SelectRootProps<TOption>, 'children'>): SelectContextValue {
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  function getOptionElementId(option: SelectOption) {
    return `${listboxId}-option-${option.id}`
  }

  function openWith(option: SelectOption | null) {
    setHighlightedId(option?.id ?? null)
    setOpen(true)
  }

  function close() {
    setHighlightedId(null)
    setOpen(false)
  }

  function selectOption(option: SelectOption) {
    if (!OptionNavigation.isEnabled(option)) {
      return
    }

    const selectedOption = options.find(
      (candidate) => candidate.id === option.id,
    )

    if (selectedOption === undefined) {
      return
    }

    onChange(selectedOption)
    close()
  }

  function selectHighlighted() {
    const option = options.find((candidate) => candidate.id === highlightedId)

    if (option !== undefined) {
      selectOption(option)
    }
  }

  function setHighlighted(option: SelectOption) {
    if (OptionNavigation.isEnabled(option)) {
      setHighlightedId(option.id)
    }
  }

  function moveHighlight(direction: HighlightDirection) {
    const option = OptionNavigation.getNextEnabled(
      options,
      highlightedId,
      direction,
    )

    setHighlightedId(option?.id ?? null)
  }

  function getOpeningOption() {
    if (value !== null && OptionNavigation.isEnabled(value)) {
      return value
    }

    return OptionNavigation.getFirstEnabled(options)
  }

  function openSelected() {
    openWith(getOpeningOption())
  }

  function toggleOpen() {
    if (open) {
      close()
      return
    }

    openSelected()
  }

  const highlightedOption =
    highlightedId === null
      ? null
      : (options.find((option) => option.id === highlightedId) ?? null)

  return {
    highlightedId,
    highlightedOptionElementId:
      highlightedOption === null
        ? undefined
        : getOptionElementId(highlightedOption),
    listboxId,
    open,
    selectedOption: value,
    close,
    getOptionElementId,
    moveHighlight,
    openFirst: () => {
      openWith(OptionNavigation.getFirstEnabled(options))
    },
    openLast: () => {
      openWith(OptionNavigation.getLastEnabled(options))
    },
    openSelected,
    selectHighlighted,
    selectOption,
    setHighlighted,
    toggleOpen,
  }
}
