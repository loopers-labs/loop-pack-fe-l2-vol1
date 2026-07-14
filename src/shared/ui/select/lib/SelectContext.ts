import { createContext, use } from 'react'

import type { SelectContextValue } from '../types'

class SelectUsageError extends Error {
  constructor(readonly partName: string) {
    super(`Select.${partName} must be used inside Select.Root`)
  }
}

export const SelectContext = createContext<SelectContextValue | null>(null)

export function useSelectContext(partName: string) {
  const context = use(SelectContext)

  if (context === null) {
    throw new SelectUsageError(partName)
  }

  return context
}
