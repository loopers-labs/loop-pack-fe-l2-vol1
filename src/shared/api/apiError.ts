// API 호출 실패를 종류로 구분하는 공통 에러 타입. 특정 화면의 문구·행위는 담지 않는다(shared 규칙).
// - HttpError: 서버가 응답은 했으나 실패 상태(4xx·5xx). status 로 클라이언트 오류/서버 오류를 가른다.
// - NetworkError: 응답 자체를 받지 못함(fetch reject — 오프라인·DNS·CORS 등).
// 비즈니스 오류(예: 재고 부족)는 이 인프라 계층이 아니라 그 행위를 소유한 상위 레이어에서 정의한다.
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

// 첫 로드에서 화면 전체를 에러 경계로 넘길 "예상 못한" 오류인가.
// 서버 오류(5xx)·네트워크 단절만 해당한다. 4xx(잘못된 요청)는 호출부가 화면 안에서 다룰 몫이라 제외한다.
export function isServerError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;

  return error instanceof HttpError && error.status >= 500;
}
