// API 오류 응답의 모양. 특정 도메인에 속하지 않는 HTTP 레벨 계약이라 shared가 소유한다.
export type ApiErrorResponse = {
  message: string;
};
