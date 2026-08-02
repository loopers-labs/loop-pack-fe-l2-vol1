import { HttpError } from "./http-error";

// res.ok가 false면 throw한다 — TanStack Query가 이 throw를 받아 error 상태로 전환한다.
export async function fetchJson<T>(input: string): Promise<T> {
  const res = await fetch(input);

  if (!res.ok) {
    const error: unknown = await res.json().catch(() => null);
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : undefined;

    throw new HttpError(res.status, message);
  }

  const body: T = await res.json();
  return body;
}
