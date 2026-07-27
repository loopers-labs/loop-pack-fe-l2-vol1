'use client'

import { useEffect } from 'react'

type PersistApi = {
  persist: {
    rehydrate: () => Promise<void> | void
    hasHydrated: () => boolean
  }
}

export function useHydratePersistedStore(store: PersistApi) {
  useEffect(() => {
    if (store.persist.hasHydrated()) {
      return
    }
    void store.persist.rehydrate()
  }, [store])
}
