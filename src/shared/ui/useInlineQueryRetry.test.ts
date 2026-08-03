import { describe, expect, it } from 'vitest'

import { InlineQueryRetryTransition } from './useInlineQueryRetry'

describe('InlineQueryRetryTransition', () => {
  it('keeps a same-scope retry visible until its completion', () => {
    // Given
    const scope = 'query-scope-a'
    const message = '상품을 다시 불러오지 못했습니다.'

    // When
    const retryState = InlineQueryRetryTransition.transition(null, {
      type: 'started',
      scope,
      message,
    })
    const completedState = InlineQueryRetryTransition.transition(retryState, {
      type: 'completed',
      scope,
    })

    // Then
    expect(InlineQueryRetryTransition.activeMessage(retryState, scope)).toBe(
      message,
    )
    expect(
      InlineQueryRetryTransition.activeMessage(completedState, scope),
    ).toBe(null)
  })

  it('hides a scope A retry when scope B becomes active and A completes', () => {
    // Given
    const scopeA = 'query-scope-a'
    const scopeB = 'query-scope-b'
    const retryState = InlineQueryRetryTransition.transition(null, {
      type: 'started',
      scope: scopeA,
      message: 'scope A retry failed',
    })

    // When
    const completedState = InlineQueryRetryTransition.transition(retryState, {
      type: 'completed',
      scope: scopeA,
    })

    // Then
    expect(InlineQueryRetryTransition.activeMessage(retryState, scopeB)).toBe(
      null,
    )
    expect(
      InlineQueryRetryTransition.activeMessage(completedState, scopeB),
    ).toBe(null)
  })

  it('keeps a scope B retry active when scope A completion arrives', () => {
    // Given
    const scopeA = 'query-scope-a'
    const scopeB = 'query-scope-b'
    const scopeBMessage = 'scope B retry failed'
    const scopeARetry = InlineQueryRetryTransition.transition(null, {
      type: 'started',
      scope: scopeA,
      message: 'scope A retry failed',
    })
    const scopeBRetry = InlineQueryRetryTransition.transition(scopeARetry, {
      type: 'started',
      scope: scopeB,
      message: scopeBMessage,
    })

    // When
    const stateAfterScopeACompletion = InlineQueryRetryTransition.transition(
      scopeBRetry,
      {
        type: 'completed',
        scope: scopeA,
      },
    )

    // Then
    expect(
      InlineQueryRetryTransition.activeMessage(
        stateAfterScopeACompletion,
        scopeB,
      ),
    ).toBe(scopeBMessage)
  })
})
