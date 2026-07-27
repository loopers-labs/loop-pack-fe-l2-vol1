import type { ComponentProps, MouseEvent } from 'react'

import { useDialogContext } from '../lib/DialogContext'
import { DialogPortal } from './DialogPortal'

type DialogOverlayProps = Omit<ComponentProps<'div'>, 'onClick'> & {
  readonly onClick?: (event: MouseEvent<HTMLDivElement>) => void
}

export function DialogOverlay({
  children,
  onClick,
  ...divProps
}: DialogOverlayProps) {
  const dialog = useDialogContext('Overlay')

  function handleClick(event: MouseEvent<HTMLDivElement>) {
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
      <div {...divProps} role="presentation" onClick={handleClick}>
        {children}
      </div>
    </DialogPortal>
  )
}
