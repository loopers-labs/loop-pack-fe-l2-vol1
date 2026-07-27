import type { RefObject } from 'react'
import { createContext, use } from 'react'

type SelectTriggerRefContextValue = RefObject<HTMLButtonElement | null>

export const SelectTriggerRefContext =
  createContext<SelectTriggerRefContextValue | null>(null)

class SelectTriggerRefUsageError extends Error {
  readonly name = 'SelectTriggerRefUsageError'

  constructor(readonly partName: string) {
    super(`Select.${partName} must be used inside Select.Root`)
  }
}

export function useSelectTriggerRef(partName: string) {
  const context = use(SelectTriggerRefContext)

  if (context === null) {
    throw new SelectTriggerRefUsageError(partName)
  }

  return context
}
