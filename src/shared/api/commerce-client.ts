import type { ApiErrorResponse } from "@/types/commerce";

export class CommerceApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CommerceApiError";
    this.status = status;
  }
}

export const isUnauthorizedError = (error: unknown): error is CommerceApiError =>
  error instanceof CommerceApiError && error.status === 401;

// 서버(metadata 등)에서는 절대 URL이 필요하다. 클라이언트는 상대 URL 그대로 사용
const serverOrigin = () =>
  typeof window === "undefined" ? (process.env.APP_ORIGIN ?? "http://localhost:3000") : "";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

export async function fetchCommerceApi<TData>(
  url: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<TData> {
  const response = await fetch(`${serverOrigin()}${url}`, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const parsed = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new CommerceApiError(parsed?.message ?? "요청을 처리하지 못했습니다.", response.status);
  }

  if (response.status === 204) {
    return undefined as TData;
  }

  return (await response.json()) as TData;
}
