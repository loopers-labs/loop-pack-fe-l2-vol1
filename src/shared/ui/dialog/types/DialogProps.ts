import type { ReactNode, Ref } from 'react'

import type { DialogHandle } from './DialogHandle'

export type DialogOpenChangeHandler = (open: boolean) => void

type DialogRootProps = {
  readonly children: ReactNode
  readonly ref?: Ref<DialogHandle>
}

type ControlledDialogProps = {
  readonly open: boolean
  readonly onOpenChange: DialogOpenChangeHandler
  readonly defaultOpen?: never
}

type UncontrolledDialogProps = {
  readonly defaultOpen?: boolean
  readonly onOpenChange?: DialogOpenChangeHandler
  readonly open?: never
}

/**
 * Dialog.Trigger and Dialog.Close own the native button `type` prop and default it to `button`.
 */
// exactOptionalPropertyTypes is disabled, so explicit undefined remains valid.
export type DialogProps = DialogRootProps &
  (ControlledDialogProps | UncontrolledDialogProps)
