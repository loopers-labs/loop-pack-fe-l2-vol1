import type { AuthUser, LoginRequest, SessionResponse } from "@/types/auth";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

export async function login(request: LoginRequest): Promise<AuthUser> {
  const { user } = await fetchCommerceApi<SessionResponse>("/api/auth/login", {
    method: "POST",
    body: request,
  });
  return user;
}

export function logout(): Promise<void> {
  return fetchCommerceApi<void>("/api/auth/logout", { method: "POST" });
}
