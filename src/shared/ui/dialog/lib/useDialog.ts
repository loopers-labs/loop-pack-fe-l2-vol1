import { useState } from 'react'

import type { DialogProps } from '../types/DialogProps'
import type { DialogContextValue } from './DialogContext'

export function useDialog(props: DialogProps): DialogContextValue {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    props.defaultOpen === true,
  )
  const [titleId, setTitleId] = useState<string | undefined>(undefined)
  const [descriptionId, setDescriptionId] = useState<string | undefined>(
    undefined,
  )
  const controlled = Object.hasOwn(props, 'open')

  function requestOpenChange(nextOpen: boolean) {
    if (controlled) {
      props.onOpenChange?.(nextOpen)
      return
    }

    setUncontrolledOpen(nextOpen)
    props.onOpenChange?.(nextOpen)
  }

  return {
    open: controlled ? props.open === true : uncontrolledOpen,
    requestOpenChange,
    titleId,
    descriptionId,
    registerTitleId: setTitleId,
    registerDescriptionId: setDescriptionId,
  }
}
