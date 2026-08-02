import type { ApiErrorResponse } from "./types";

// res.ok가 false면 throw한다 — TanStack Query가 이 throw를 받아 error 상태로 전환한다.
export async function fetchJson<T>(input: string): Promise<T> {
  const res = await fetch(input);

  if (!res.ok) {
    const error: ApiErrorResponse = await res.json();
    throw new Error(error.message);
  }

  const body: T = await res.json();
  return body;
}
