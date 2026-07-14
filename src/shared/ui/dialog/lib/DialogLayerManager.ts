type DialogLayer = {
  readonly id: string
  readonly requestClose: () => void
}

type DialogLayerState = {
  readonly handleKeyDown: (event: KeyboardEvent) => void
  readonly layers: Array<DialogLayer>
}

export class DialogLayerManager {
  private static readonly states = new WeakMap<Document, DialogLayerState>()

  private constructor() {}

  static register(ownerDocument: Document, layer: DialogLayer) {
    const currentState = DialogLayerManager.states.get(ownerDocument)

    if (currentState !== undefined) {
      currentState.layers.push(layer)
      return DialogLayerManager.createRelease(
        ownerDocument,
        currentState,
        layer.id,
      )
    }

    const layers = [layer]
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      const topLayer = layers.at(-1)

      if (topLayer === undefined) {
        return
      }

      event.preventDefault()
      topLayer.requestClose()
    }
    const nextState = { handleKeyDown, layers } satisfies DialogLayerState

    DialogLayerManager.states.set(ownerDocument, nextState)
    ownerDocument.addEventListener('keydown', handleKeyDown)

    return DialogLayerManager.createRelease(ownerDocument, nextState, layer.id)
  }

  private static createRelease(
    ownerDocument: Document,
    state: DialogLayerState,
    layerId: string,
  ) {
    let active = true

    return () => {
      if (!active) {
        return
      }

      active = false
      const layerIndex = state.layers.findIndex((layer) => layer.id === layerId)

      if (layerIndex === -1) {
        return
      }

      state.layers.splice(layerIndex, 1)

      if (state.layers.length > 0) {
        return
      }

      ownerDocument.removeEventListener('keydown', state.handleKeyDown)
      DialogLayerManager.states.delete(ownerDocument)
    }
  }
}
