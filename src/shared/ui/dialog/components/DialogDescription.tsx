import type { ComponentProps } from 'react'

import { useDialogContext } from '../lib/DialogContext'

type DialogDescriptionProps = ComponentProps<'p'>

export function DialogDescription(descriptionProps: DialogDescriptionProps) {
  useDialogContext('Description')

  return <p {...descriptionProps} />
}
