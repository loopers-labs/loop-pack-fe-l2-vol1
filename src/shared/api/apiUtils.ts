import { AuthRequiredError } from "./AuthRequiredError";
import type { ApiErrorResponse } from "./types";

type ApiFetchAuthPolicy = "none" | "optional" | "required";

type ApiFetchOptions = RequestInit & {
  auth?: ApiFetchAuthPolicy;
};

export async function parseApiError(response: Response, fallbackMessage: string) {
  try {
    const error = (await response.json()) as Partial<ApiErrorResponse>;
    return new Error(error.message ?? fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { auth = "none", ...init } = options;
  const apiUrl = auth === "none" ? createApiUrl(path) : createSameOriginApiUrl(path);
  const requestInit = auth === "none" ? init : { ...init, credentials: "include" as const };
  const response = await fetch(apiUrl, requestInit);

  if (auth === "required" && response.status === 401) {
    throw new AuthRequiredError();
  }

  return response;
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
