import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { Store } from '../../utils'
import { LocalStorageValue } from './storage'
import type {
  LocalStorageSetState,
  LocalStorageStateValue,
  UseLocalStorageStateOptions,
  UseLocalStorageStateReturn,
} from './types'

export function useLocalStorage<T extends LocalStorageStateValue>(
  options: UseLocalStorageStateOptions<T>,
): UseLocalStorageStateReturn<T> {
  const { key } = options
  const [store] = useState(() => new Store(LocalStorageValue.read(options)))

  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getInitialState(),
  )

  useEffect(() => {
    LocalStorageValue.write(key, state)
  }, [key, state])

  const setState = useCallback<LocalStorageSetState<T>>(
    (nextState) => {
      store.setState(nextState)
    },
    [store],
  )

  return [state, setState]
}
