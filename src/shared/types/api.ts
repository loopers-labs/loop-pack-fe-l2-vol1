// [AI] 크로스커팅 API 타입/값 — 특정 도메인에 속하지 않는 공용 에러·시나리오 계약.
export type ApiErrorResponse = {
  message: string;
};

export type MockApiScenario = 'empty' | 'error' | 'slow';

export const MOCK_API_SCENARIOS = [
  'empty',
  'error',
  'slow',
] as const satisfies readonly MockApiScenario[];

export const isMockApiScenario = (value: string | null | undefined): value is MockApiScenario =>
  value !== null && value !== undefined && MOCK_API_SCENARIOS.some((s) => s === value);
