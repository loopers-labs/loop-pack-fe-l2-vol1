import { type ComponentProps, useId, useLayoutEffect } from 'react'

import { useDialogContext } from '../lib/DialogContext'

type DialogTitleProps = ComponentProps<'h2'>

export function DialogTitle({ id, children, ...titleProps }: DialogTitleProps) {
  const dialog = useDialogContext('Title')
  const generatedId = useId()
  const titleId = id ?? generatedId

  useLayoutEffect(() => {
    dialog.registerTitleId(titleId)

    return () => {
      dialog.registerTitleId(undefined)
    }
  }, [dialog, titleId])

  return (
    <h2 {...titleProps} id={titleId}>
      {children}
    </h2>
  )
}
