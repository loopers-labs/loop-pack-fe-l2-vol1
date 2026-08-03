/**
 * API 실패를 종류별로 구분하는 에러 타입.
 *
 * 이전에는 apiClient 가 모든 실패를 new Error(message) 로 뭉개 status 가 사라졌고,
 * 그래서 "5xx 는 경계로, 4xx 는 인라인" 같은 기준을 코드로 옮길 수 없었다.
 *
 * shared 에 두지만 특정 화면의 문구나 행위는 넣지 않는다.
 * 사용자에게 무엇을 보여줄지는 각 화면이 정한다.
 */

/** 서버가 응답은 했으나 실패 상태코드를 준 경우. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** 요청이 서버에 닿지 못한 경우(오프라인, DNS, CORS 등). */
export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

/**
 * 이 에러를 Error Boundary 로 올릴지 판단한다.
 *
 * 5xx 와 네트워크 실패는 사용자가 손쓸 수 없으므로 경계로 올린다.
 * 4xx 는 사용자가 조건을 고쳐 빠져나올 수 있으므로 화면 안에서 처리한다.
 * 경계로 던지면 고칠 수단(필터 폼)까지 언마운트되어 복구 경로가 사라진다.
 */
export const shouldEscalateToBoundary = (error: unknown): boolean =>
  error instanceof NetworkError || (error instanceof HttpError && error.status >= 500);
