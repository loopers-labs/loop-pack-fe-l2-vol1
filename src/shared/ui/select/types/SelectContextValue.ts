import type { HighlightDirection } from './HighlightDirection'
import type { SelectOption } from './SelectOption'

export type SelectContextValue = {
  readonly highlightedId: string | null
  readonly highlightedOptionElementId: string | undefined
  readonly listboxId: string
  readonly open: boolean
  readonly selectedOption: SelectOption | null
  readonly close: () => void
  readonly getOptionElementId: (option: SelectOption) => string
  readonly moveHighlight: (direction: HighlightDirection) => void
  readonly openFirst: () => void
  readonly openLast: () => void
  readonly openSelected: () => void
  readonly selectHighlighted: () => void
  readonly selectOption: (option: SelectOption) => void
  readonly setHighlighted: (option: SelectOption) => void
  readonly toggleOpen: () => void
}
