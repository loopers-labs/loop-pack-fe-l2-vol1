import type { HighlightDirection, SelectOption } from '../types'

export class OptionNavigation {
  private constructor() {}

  static isEnabled(option: SelectOption) {
    return option.disabled !== true
  }

  static getFirstEnabled(options: ReadonlyArray<SelectOption>) {
    return options.find((option) => OptionNavigation.isEnabled(option)) ?? null
  }

  static getLastEnabled(options: ReadonlyArray<SelectOption>) {
    return (
      options.filter((option) => OptionNavigation.isEnabled(option)).at(-1) ??
      null
    )
  }

  static getNextEnabled(
    options: ReadonlyArray<SelectOption>,
    highlightedId: string | null,
    direction: HighlightDirection,
  ) {
    const enabledOptions = options.filter((option) =>
      OptionNavigation.isEnabled(option),
    )

    if (enabledOptions.length === 0 || highlightedId === null) {
      return OptionNavigation.getInitialEnabled(enabledOptions, direction)
    }

    const highlightedIndex = enabledOptions.findIndex(
      (option) => option.id === highlightedId,
    )

    if (highlightedIndex < 0) {
      return OptionNavigation.getInitialEnabled(enabledOptions, direction)
    }

    const offset = direction === 'forward' ? 1 : -1
    const nextIndex =
      (highlightedIndex + offset + enabledOptions.length) %
      enabledOptions.length

    return enabledOptions[nextIndex] ?? null
  }

  private static getInitialEnabled(
    enabledOptions: ReadonlyArray<SelectOption>,
    direction: HighlightDirection,
  ) {
    switch (direction) {
      case 'forward':
        return enabledOptions[0] ?? null
      case 'backward':
        return enabledOptions.at(-1) ?? null
      default: {
        const exhaustiveDirection: never = direction
        return exhaustiveDirection
      }
    }
  }
}
