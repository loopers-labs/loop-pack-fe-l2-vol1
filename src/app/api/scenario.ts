// mock API 전용 제어값. 프론트는 이 타입을 알 필요가 없다 —
// 알면 scenario를 사용자 URL 상태에 넣고 싶어진다(과제 4단계 금지 사항).
export type MockApiScenario = "empty" | "error";
