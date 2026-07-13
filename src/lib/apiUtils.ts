import type { ApiErrorResponse } from "@/types/commerce";

export async function parseApiError(response: Response, fallbackMessage: string) {
  try {
    const error = (await response.json()) as Partial<ApiErrorResponse>;
    return new Error(error.message ?? fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
}

export function setSearchParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value === undefined || value === "") {
    return;
  }

  params.set(key, String(value));
}
