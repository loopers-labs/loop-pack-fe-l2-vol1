// HTTP 응답 실패를 나타내는 오류. status를 보존해 "경계로 던질지 / 화면 안에서 처리할지"를
// 호출부가 판단할 수 있게 한다(4xx는 인라인, 5xx는 Error Boundary).
// 네트워크 자체가 실패하면 fetch가 TypeError를 던지므로 이 타입이 아니다 — 그것으로 둘을 구분한다.
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
