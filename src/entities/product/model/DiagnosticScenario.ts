import * as z from 'zod'

export const mockApiScenarioSchema = z.enum(['slow', 'empty', 'error'])

export type MockApiScenario = z.infer<typeof mockApiScenarioSchema>

export type DiagnosticScenario = {
  readonly scenario?: MockApiScenario
}

export const parseDiagnosticScenario = (input: unknown): DiagnosticScenario => {
  const result = mockApiScenarioSchema.safeParse(input)
  return result.success ? { scenario: result.data } : {}
}
