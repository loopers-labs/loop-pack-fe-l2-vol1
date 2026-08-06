// 측정 전용 mock 시나리오 플래그. 빌드 env 하나로 서버 prefetch와 클라 요청이
// 같은 값을 읽어 query key가 일치하게 한다. 사용자 URL 상태(searchParams)와는 분리한다.
// 값은 app/api의 MockApiScenario와 같지만, features·_pages가 app 레이어를 import하면
// FSD 상방 의존이 되므로 여기 값만 따로 둔다.
const MOCK_SCENARIOS = ["slow", "empty", "error"] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export function readMockScenario(): MockScenario | null {
  const value = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  return MOCK_SCENARIOS.find((scenario) => scenario === value) ?? null;
}

// 시나리오가 있으면 GET 경로에 붙인다. 없으면 원래 경로 그대로.
export function withScenario(path: string, scenario: MockScenario | null): string {
  if (!scenario) {
    return path;
  }
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}scenario=${scenario}`;
}
