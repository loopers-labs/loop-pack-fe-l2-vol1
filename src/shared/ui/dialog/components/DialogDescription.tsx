import { type ComponentProps, useId, useLayoutEffect } from 'react'

import { useDialogContext } from '../lib/DialogContext'

type DialogDescriptionProps = ComponentProps<'p'>

export function DialogDescription({
  id,
  children,
  ...descriptionProps
}: DialogDescriptionProps) {
  const dialog = useDialogContext('Description')
  const generatedId = useId()
  const descriptionId = id ?? generatedId

  useLayoutEffect(() => {
    dialog.registerDescriptionId(descriptionId)

    return () => {
      dialog.registerDescriptionId(undefined)
    }
  }, [dialog, descriptionId])

  return (
    <p {...descriptionProps} id={descriptionId}>
      {children}
    </p>
  )
}
