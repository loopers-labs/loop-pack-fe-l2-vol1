import type { ComponentProps, MouseEvent } from 'react'

import { useDialogContext } from '../lib/DialogContext'

type DialogTriggerProps = Omit<ComponentProps<'button'>, 'type'>

export function DialogTrigger({ onClick, ...buttonProps }: DialogTriggerProps) {
  const dialog = useDialogContext('Trigger')

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    dialog.requestOpenChange(true)
  }

  return <button {...buttonProps} type="button" onClick={handleClick} />
}
