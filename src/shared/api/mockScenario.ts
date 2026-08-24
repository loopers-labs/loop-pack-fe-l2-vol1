export const MOCK_API_SCENARIOS = ['empty', 'error', 'slow'] as const;

export type MockApiScenario = (typeof MOCK_API_SCENARIOS)[number];
