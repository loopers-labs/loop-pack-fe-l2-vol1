import { useId, useImperativeHandle } from 'react'

import { DialogContext } from '../lib/DialogContext'
import { useDialog } from '../lib/useDialog'
import { useDialogLifecycle } from '../lib/useDialogLifecycle'
import type { DialogProps } from '../types/DialogProps'

export function DialogRoot(props: DialogProps) {
  const { children, ref } = props
  const dialog = useDialog(props)
  const { open, requestOpenChange } = dialog
  const layerId = useId()

  useImperativeHandle(
    ref,
    () => ({
      open() {
        requestOpenChange(true)
      },
      close() {
        requestOpenChange(false)
      },
      toggle() {
        requestOpenChange(!open)
      },
    }),
    [open, requestOpenChange],
  )

  useDialogLifecycle({
    layerId,
    open,
    requestOpenChange,
  })

  return <DialogContext value={dialog}>{children}</DialogContext>
}
