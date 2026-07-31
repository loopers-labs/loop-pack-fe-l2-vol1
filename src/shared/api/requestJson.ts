import { HttpError, NetworkError } from "./apiError";

// API 공통 에러 규약: 라우트 핸들러가 실패 시 이 모양으로 응답한다.
export type ApiErrorResponse = {
  message: string;
};

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    // fetch 는 응답을 못 받았을 때만 reject 한다(오프라인·DNS·CORS). HTTP 실패 상태는 여기로 안 온다.
    throw new NetworkError("네트워크에 연결하지 못했습니다.");
  }

  if (!response.ok) {
    const body: ApiErrorResponse | null = await response
      .json()
      .catch(() => null);
    throw new HttpError(
      response.status,
      body?.message ?? "요청을 처리하지 못했습니다.",
    );
  }

  const data: T = await response.json();

  return data;
}
