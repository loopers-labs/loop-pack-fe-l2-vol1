import type { ApiErrorResponse } from "@/types/commerce";

export class CommerceApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CommerceApiError";
    this.status = status;
  }
}

// 서버(metadata 등)에서는 절대 URL이 필요하다. 클라이언트는 상대 URL 그대로 사용
const serverOrigin = () =>
  typeof window === "undefined" ? (process.env.APP_ORIGIN ?? "http://localhost:3000") : "";

export async function fetchCommerceApi<TData>(url: string): Promise<TData> {
  const response = await fetch(`${serverOrigin()}${url}`);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new CommerceApiError(body?.message ?? "요청을 처리하지 못했습니다.", response.status);
  }

  return (await response.json()) as TData;
}
