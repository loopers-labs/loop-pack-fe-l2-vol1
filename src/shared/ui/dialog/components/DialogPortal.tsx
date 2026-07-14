import { type ReactNode, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

type DialogPortalProps = {
  readonly children: ReactNode
}

function subscribeToDocumentReady() {
  return () => undefined
}

function getDocumentReadySnapshot() {
  return true
}

function getServerDocumentReadySnapshot() {
  return false
}

export function DialogPortal({ children }: DialogPortalProps) {
  const documentReady = useSyncExternalStore(
    subscribeToDocumentReady,
    getDocumentReadySnapshot,
    getServerDocumentReadySnapshot,
  )

  if (!documentReady) {
    return null
  }

  return createPortal(children, document.body)
}
