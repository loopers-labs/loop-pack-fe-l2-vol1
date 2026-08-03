import { useState } from 'react'

type UseInlineQueryRetryOptions = {
  readonly scope: string
  readonly isFetching: boolean
  readonly refetch: () => Promise<unknown>
}

type InlineQueryRetryState = {
  readonly scope: string
  readonly message: string
} | null

type InlineQueryRetryAction =
  | {
      readonly type: 'started'
      readonly scope: string
      readonly message: string
    }
  | {
      readonly type: 'completed'
      readonly scope: string
    }

export class InlineQueryRetryTransition {
  static transition(
    state: InlineQueryRetryState,
    action: InlineQueryRetryAction,
  ): InlineQueryRetryState {
    switch (action.type) {
      case 'started':
        return {
          scope: action.scope,
          message: action.message,
        }
      case 'completed':
        return state?.scope === action.scope ? null : state
      default: {
        const unreachableAction: never = action
        return unreachableAction
      }
    }
  }

  static activeMessage(
    state: InlineQueryRetryState,
    scope: string,
  ): string | null {
    return state?.scope === scope ? state.message : null
  }
}

export function useInlineQueryRetry({
  scope,
  isFetching,
  refetch,
}: UseInlineQueryRetryOptions) {
  const [retryState, setRetryState] = useState<InlineQueryRetryState>(null)
  const message = InlineQueryRetryTransition.activeMessage(retryState, scope)

  const retry = (nextMessage: string) => {
    const retryScope = scope
    setRetryState((currentState) =>
      InlineQueryRetryTransition.transition(currentState, {
        type: 'started',
        scope: retryScope,
        message: nextMessage,
      }),
    )
    void refetch().then(() => {
      setRetryState((currentState) =>
        InlineQueryRetryTransition.transition(currentState, {
          type: 'completed',
          scope: retryScope,
        }),
      )
    })
  }

  return {
    isRetrying: message !== null && isFetching,
    message,
    retry,
  }
}
