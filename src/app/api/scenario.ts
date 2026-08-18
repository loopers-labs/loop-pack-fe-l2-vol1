// mock API 전용 제어값. 프론트는 이 타입을 알 필요가 없다 —
// 알면 scenario를 사용자 URL 상태에 넣고 싶어진다(과제 4단계 금지 사항).
// 7주차에 "slow" 추가 — 정상과 같은 응답을 1.5초 뒤에 돌려준다(병목 재현용).
export type MockApiScenario = "empty" | "error" | "slow";
