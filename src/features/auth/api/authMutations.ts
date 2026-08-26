import { getBaseUrl, requestJson } from "@/shared/api";
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
