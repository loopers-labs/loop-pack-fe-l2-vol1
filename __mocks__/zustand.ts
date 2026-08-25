import { act } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import type * as ZustandTypes from 'zustand'

export * from 'zustand'

const { create: actualCreate, createStore: actualCreateStore } =
  await vi.importActual<typeof ZustandTypes>('zustand')

const storeResetFunctions = new Set<() => void>()

const createUncurried = <T>(stateCreator: ZustandTypes.StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getInitialState()
  storeResetFunctions.add(() => store.setState(initialState, true))
  return store
}

export const create = (<T>(stateCreator: ZustandTypes.StateCreator<T>) =>
  typeof stateCreator === 'function'
    ? createUncurried(stateCreator)
    : createUncurried) as typeof ZustandTypes.create

const createStoreUncurried = <T>(
  stateCreator: ZustandTypes.StateCreator<T>,
) => {
  const store = actualCreateStore(stateCreator)
  const initialState = store.getInitialState()
  storeResetFunctions.add(() => store.setState(initialState, true))
  return store
}

export const createStore = (<T>(stateCreator: ZustandTypes.StateCreator<T>) =>
  typeof stateCreator === 'function'
    ? createStoreUncurried(stateCreator)
    : createStoreUncurried) as typeof ZustandTypes.createStore

afterEach(() => {
  act(() => {
    storeResetFunctions.forEach((resetStore) => resetStore())
  })
})
