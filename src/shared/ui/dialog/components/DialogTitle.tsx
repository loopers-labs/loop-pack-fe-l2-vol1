import type { ComponentProps } from 'react'

import { useDialogContext } from '../lib/DialogContext'

type DialogTitleProps = ComponentProps<'h2'>

export function DialogTitle({ children, ...titleProps }: DialogTitleProps) {
  useDialogContext('Title')

  return <h2 {...titleProps}>{children}</h2>
}
