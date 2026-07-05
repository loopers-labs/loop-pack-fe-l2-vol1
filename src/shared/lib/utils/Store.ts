type Listener = () => void
type StateUpdater<T> = (prevState: Readonly<T>) => T

export class Store<T> {
  private state: T
  private readonly listeners: Set<Listener> = new Set()

  constructor(private readonly initialState: T) {
    this.state = initialState
  }

  getState(): Readonly<T> {
    return this.state
  }

  getInitialState(): Readonly<T> {
    return this.initialState
  }

  setState(nextState: T | StateUpdater<T>): void {
    const prevState = this.state
    const resolvedState =
      typeof nextState === 'function'
        ? (nextState as StateUpdater<T>)(prevState)
        : nextState

    if (Object.is(prevState, resolvedState)) {
      return
    }

    this.state = resolvedState
    this.notify()
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of Array.from(this.listeners)) {
      listener()
    }
  }
}
