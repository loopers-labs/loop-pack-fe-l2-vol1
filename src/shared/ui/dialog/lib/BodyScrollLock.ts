type BodyScrollLockState = {
  count: number
  readonly previousOverflow: string
}

export class BodyScrollLock {
  private static readonly states = new WeakMap<Document, BodyScrollLockState>()

  private constructor() {}

  static lock(ownerDocument: Document) {
    const currentState = BodyScrollLock.states.get(ownerDocument)

    if (currentState !== undefined) {
      currentState.count += 1
      return BodyScrollLock.createRelease(ownerDocument)
    }

    const nextState = {
      count: 1,
      previousOverflow: ownerDocument.body.style.overflow,
    } satisfies BodyScrollLockState

    ownerDocument.body.style.overflow = 'hidden'
    BodyScrollLock.states.set(ownerDocument, nextState)

    return BodyScrollLock.createRelease(ownerDocument)
  }

  private static createRelease(ownerDocument: Document) {
    let active = true

    return () => {
      if (!active) {
        return
      }

      active = false
      const currentState = BodyScrollLock.states.get(ownerDocument)

      if (currentState === undefined || currentState.count === 0) {
        return
      }

      currentState.count -= 1

      if (currentState.count > 0) {
        return
      }

      ownerDocument.body.style.overflow = currentState.previousOverflow
      BodyScrollLock.states.delete(ownerDocument)
    }
  }
}
