import { AuthRequiredError } from "./AuthRequiredError";
import type { ApiErrorResponse } from "./types";

type ParseApiErrorOptions = {
  authRequired?: boolean;
};

export async function parseApiError(
  response: Response,
  fallbackMessage: string,
  options: ParseApiErrorOptions = {},
) {
  if (options.authRequired === true && response.status === 401) {
    return new AuthRequiredError();
  }

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
    const browserBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    return browserBaseUrl === undefined ? path : new URL(path, browserBaseUrl).toString();
  }

  const baseUrl =
    process.env.INTERNAL_API_BASE_URL ?? process.env.APP_ORIGIN ?? "http://localhost:3000";

  return new URL(path, baseUrl).toString();
}

export function createSameOriginApiUrl(path: string) {
  if (typeof window !== "undefined") {
    return path;
  }

  const baseUrl = process.env.APP_ORIGIN ?? "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}
