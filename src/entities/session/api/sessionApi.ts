import { createSameOriginApiUrl, parseApiError } from "@/shared/api/apiUtils";
import type { LoginRequest, SessionResponse, SessionState } from "../model/types";

export async function getSession(): Promise<SessionState> {
  const response = await fetch(createSameOriginApiUrl("/api/auth/me"), {
    credentials: "include",
  });

  if (response.status === 401) {
    return { user: null };
  }

  if (!response.ok) {
    throw await parseApiError(response, "세션을 확인하지 못했습니다.");
  }

  return response.json() as Promise<SessionResponse>;
}

export async function login(request: LoginRequest): Promise<SessionResponse> {
  const response = await fetch(createSameOriginApiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response, "로그인에 실패했습니다.");
  }

  return response.json() as Promise<SessionResponse>;
}

export async function logout(): Promise<void> {
  const response = await fetch(createSameOriginApiUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response, "로그아웃에 실패했습니다.");
  }
}
