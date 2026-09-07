import { getBaseUrl, requestJson, HttpError } from "@/shared/api";
import type { SessionResponse } from "@/entities/session";

export type LoginCredentials = {
  email: string;
  password: string;
};

export function login(credentials: LoginCredentials): Promise<SessionResponse> {
  return requestJson<SessionResponse>(`${getBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

// 로그아웃은 204(no content)라 파싱할 본문이 없다. requestJson(=json 파싱) 대신 상태코드만 확인한다.
export async function logout(): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/auth/logout`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new HttpError(response.status, "로그아웃하지 못했습니다.");
  }
}
