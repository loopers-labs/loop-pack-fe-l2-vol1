type ApiErrorResponse = {
  message: string;
};

export class CommerceApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CommerceApiError";
    this.status = status;
  }
}

export async function fetchCommerceApi<TData>(url: string): Promise<TData> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new CommerceApiError(body?.message ?? "요청을 처리하지 못했습니다.", response.status);
  }

  return (await response.json()) as TData;
}
