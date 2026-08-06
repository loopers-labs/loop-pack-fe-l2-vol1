/**
 * mock API 전용 제어값.
 *
 * 실패·빈 상태를 재현하기 위한 검증용이라 프론트엔드 타입이 아니다.
 * 사용자 URL 상태(ProductListQuery)에도 포함하지 않는다.
 */
export type MockApiScenario = 'empty' | 'error' | 'slow';
