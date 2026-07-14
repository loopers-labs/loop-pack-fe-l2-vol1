import type { ComponentProps, MouseEvent } from 'react'

import { useDialogContext } from '../lib/DialogContext'
import { DialogPortal } from './DialogPortal'

type DialogOverlayProps = ComponentProps<'button'>

export function DialogOverlay({
  children,
  onClick,
  type = 'button',
  ...buttonProps
}: DialogOverlayProps) {
  const dialog = useDialogContext('Overlay')

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    dialog.requestOpenChange(false)
  }

  if (!dialog.open) {
    return null
  }

  return (
    <DialogPortal>
      <button {...buttonProps} type={type} onClick={handleClick}>
        {children}
      </button>
    </DialogPortal>
  )
}
