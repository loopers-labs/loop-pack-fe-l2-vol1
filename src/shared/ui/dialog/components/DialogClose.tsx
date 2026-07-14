import type { ComponentProps, MouseEvent } from 'react'

import { useDialogContext } from '../lib/DialogContext'

type DialogCloseProps = Omit<ComponentProps<'button'>, 'type'>

export function DialogClose({ onClick, ...buttonProps }: DialogCloseProps) {
  const dialog = useDialogContext('Close')

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    dialog.requestOpenChange(false)
  }

  return <button {...buttonProps} type="button" onClick={handleClick} />
}
