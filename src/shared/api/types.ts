/**
 * API 실패 응답 계약.
 *
 * 도메인 지식이 없어 shared 에 둔다. mock 백엔드가 이 형태로 실패를 응답하고,
 * apiClient 가 같은 형태로 파싱한다. 이전에는 apiClient 가 { message?: string } 을
 * 인라인으로 다시 선언해 계약이 두 곳에 흩어져 있었다.
 */
export type ApiErrorResponse = {
  message: string;
};
