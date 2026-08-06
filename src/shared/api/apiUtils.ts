import type { ApiErrorResponse } from "./types";

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

export function createApiUrl(path: string) {
  if (typeof window !== "undefined") {
    return path;
  }

  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";

  return new URL(path, baseUrl).toString();
}
