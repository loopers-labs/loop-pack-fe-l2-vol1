// 공통 에러 타입 — 도메인·화면 문구를 모른다. "어떤 종류의 실패인가"만 담는다.
// 화면별 메시지는 각 페이지의 api 모듈이 정한다(shared에 화면 문구 금지).

// !res.ok — 상태 코드가 있는 HTTP 오류. 재시도로 복구될 수 있다.
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// 응답이 기대한 형태가 아님 — 서버·클라이언트 계약이 깨진 것. 재시도해도 같다.
export class InvalidResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponseError';
  }
}
