import { HttpError } from "./HttpError";
import type { ApiErrorResponse } from "./types";

// API 에러 응답 좁히기 — as 없이 타입 가드로 message를 확보.
const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "message" in value && typeof value.message === "string";
};

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    // 화면 문구는 각 화면이 소유한다. 여기서는 서버가 준 message와 status만 전달한다.
    const message = isApiErrorResponse(body) ? body.message : "요청을 처리하지 못했습니다.";
    throw new HttpError(response.status, message);
  }
  return response.json();
}
