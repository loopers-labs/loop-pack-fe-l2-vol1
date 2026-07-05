import type {
  LocalStorageStateValue,
  UseLocalStorageStateOptions,
} from './types'

export class LocalStorageValue {
  private constructor() {}

  static read<T extends LocalStorageStateValue>({
    key,
    initialState,
  }: UseLocalStorageStateOptions<T>): T {
    if (typeof window === 'undefined') {
      return initialState
    }

    try {
      const serializedState = window.localStorage.getItem(key)

      if (serializedState === null) {
        return initialState
      }

      const parsedState: unknown = JSON.parse(serializedState)
      return LocalStorageValue.matchesInitialState(parsedState, initialState)
        ? parsedState
        : initialState
    } catch (error) {
      if (error instanceof DOMException || error instanceof SyntaxError) {
        return initialState
      }

      throw error
    }
  }

  static write<T extends LocalStorageStateValue>(
    key: string,
    state: Readonly<T>,
  ): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const serializedState = JSON.stringify(state)

      window.localStorage.setItem(key, serializedState)
    } catch (error) {
      if (error instanceof DOMException) {
        return
      }

      throw error
    }
  }

  private static matchesInitialState<T extends LocalStorageStateValue>(
    value: unknown,
    initialState: T,
  ): value is T {
    if (Array.isArray(initialState)) {
      return (
        Array.isArray(value) &&
        value.every((item) => LocalStorageValue.isJsonValue(item))
      )
    }

    if (initialState === null) {
      return LocalStorageValue.isJsonValue(value)
    }

    if (typeof initialState !== 'object') {
      return typeof value === typeof initialState
    }

    return LocalStorageValue.isJsonObject(value)
  }

  private static isJsonValue(value: unknown): value is LocalStorageStateValue {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      return true
    }

    if (Array.isArray(value)) {
      return value.every((item) => LocalStorageValue.isJsonValue(item))
    }

    return LocalStorageValue.isJsonObject(value)
  }

  private static isJsonObject(
    value: unknown,
  ): value is { readonly [key: string]: LocalStorageStateValue } {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    return Object.values(value).every((item) =>
      LocalStorageValue.isJsonValue(item),
    )
  }
}
