type LocalStoragePrimitive = string | number | boolean | null

export type LocalStorageStateValue =
  | LocalStoragePrimitive
  | ReadonlyArray<LocalStorageStateValue>
  | { readonly [key: string]: LocalStorageStateValue }

export type UseLocalStorageStateOptions<T extends LocalStorageStateValue> = {
  readonly key: string
  readonly initialState: T
}

export type LocalStorageStateUpdater<T extends LocalStorageStateValue> = (
  prevState: Readonly<T>,
) => T

export type LocalStorageSetState<T extends LocalStorageStateValue> = (
  nextState: T | LocalStorageStateUpdater<T>,
) => void

export type UseLocalStorageStateReturn<T extends LocalStorageStateValue> =
  readonly [state: Readonly<T>, setState: LocalStorageSetState<T>]
