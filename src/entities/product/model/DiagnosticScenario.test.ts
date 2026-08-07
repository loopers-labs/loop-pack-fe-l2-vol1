import { describe, expect, it } from 'vitest'

import { parseDiagnosticScenario } from './DiagnosticScenario'

describe('parseDiagnosticScenario', () => {
  it.each(['slow', 'empty', 'error'] as const)(
    'returns the %s scenario when the URL value is valid',
    (scenario) => {
      expect(parseDiagnosticScenario(scenario)).toEqual({ scenario })
    },
  )

  it.each([undefined, 'invalid', '', ['slow'], ['slow', 'error']])(
    'omits scenario when the URL value is missing, invalid, or repeated',
    (value) => {
      expect(parseDiagnosticScenario(value)).toEqual({})
    },
  )
})
