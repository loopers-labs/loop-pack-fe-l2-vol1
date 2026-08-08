// AI 생성
export type ApiErrorResponse = {
  message: string;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// AI 생성: week-07 3단계 — 서버(RSC/generateMetadata)는 상대 경로를 fetch할 수 없어 APP_ORIGIN을
// 붙인 절대 URL로 요청한다. APP_ORIGIN이 닿지 않는 origin이면 이 fetch가 실제로 실패해야
// generateMetadata의 query failure(→ root 공통 metadata 상속) 시나리오를 재현할 수 있다.
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const url = typeof window === 'undefined' ? `${process.env.APP_ORIGIN}${input}` : input;
  const res = await fetch(url, init);

  if (!res.ok) {
    const message = await res
      .json()
      .then((body: ApiErrorResponse) => body.message)
      .catch(() => '요청을 처리하지 못했습니다.');
    throw new ApiError(res.status, message);
  }

  return res.json();
}
