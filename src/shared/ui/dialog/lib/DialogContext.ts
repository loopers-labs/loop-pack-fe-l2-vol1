import { createContext, use } from 'react'

export type DialogContextValue = {
  readonly open: boolean
  readonly requestOpenChange: (open: boolean) => void
}

class DialogUsageError extends Error {
  readonly name = 'DialogUsageError'

  constructor(readonly partName: string) {
    super(`Dialog.${partName} must be used inside Dialog`)
  }
}

export const DialogContext = createContext<DialogContextValue | null>(null)

export function useDialogContext(partName: string) {
  const context = use(DialogContext)

  if (context === null) {
    throw new DialogUsageError(partName)
  }

  return context
}
