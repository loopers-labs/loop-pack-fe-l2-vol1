// mock API 전용 제어값. 실제 도메인 상태가 아니라 통신/제어 타입이라 shared에 둔다.
export type MockApiScenario = 'empty' | 'error' | 'slow'

// 서버 에러 응답의 공통 모양(도메인 무관 계약).
export interface ApiErrorResponse {
  message: string
}
