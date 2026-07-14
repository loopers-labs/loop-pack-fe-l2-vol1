import { useEffect, useEffectEvent } from 'react'

import { BodyScrollLock } from './BodyScrollLock'
import { DialogLayerManager } from './DialogLayerManager'

type DialogLifecycleOptions = {
  readonly layerId: string
  readonly open: boolean
  readonly requestOpenChange: (open: boolean) => void
}

export function useDialogLifecycle({
  layerId,
  open,
  requestOpenChange,
}: DialogLifecycleOptions) {
  const requestClose = useEffectEvent(() => {
    requestOpenChange(false)
  })

  useEffect(() => {
    if (!open) {
      return
    }

    const ownerDocument = document
    const releaseLayer = DialogLayerManager.register(ownerDocument, {
      id: layerId,
      requestClose,
    })
    const releaseScrollLock = BodyScrollLock.lock(ownerDocument)

    return () => {
      releaseLayer()
      releaseScrollLock()
    }
  }, [layerId, open])
}
