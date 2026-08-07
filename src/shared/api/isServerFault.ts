import { HttpError } from "./HttpError";

// 경계로 던질 오류인지 판단한다.
//   5xx  → 사용자가 조건을 바꿔도 해결되지 않는다 → Error Boundary
//   4xx  → 사용자 입력으로 만들어진 상태다(예: ?page=0) → 화면 안에서 처리
//   네트워크 실패(HttpError가 아님) → 서버 문제로 보고 경계로 보낸다
// 문구·행위는 화면이 소유한다. 여기서는 분류만 한다.
export const isServerFault = (error: unknown): boolean =>
  error instanceof HttpError ? error.status >= 500 : true;
