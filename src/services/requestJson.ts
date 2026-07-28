import type { ApiErrorResponse } from "@/types/commerce";

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const body: ApiErrorResponse | null = await response
      .json()
      .catch(() => null);
    throw new Error(body?.message ?? "요청을 처리하지 못했습니다.");
  }

  const data: T = await response.json();

  return data;
}
