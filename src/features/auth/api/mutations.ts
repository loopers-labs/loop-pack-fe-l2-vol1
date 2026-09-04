import { useMutation } from "@tanstack/react-query";

import type { SessionUser } from "@/entities/session/model/types";
import { fetchJson } from "@/shared/api/fetcher";

// 인증 요청 계약(클라 몫). 서버(app)의 타입은 features가 올려다볼 수 없어 여기서 정의한다.
export type LoginInput = { email: string; password: string };
type LoginResult = { user: SessionUser };

// 로그인·로그아웃은 각자 POST 한 번뿐이라 한 파일에 둔다(queries.ts와 같은 결).
// 성공 뒤 처리(router.refresh·이동)는 router가 필요해 호출 컴포넌트가 맡는다.
export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      fetchJson<LoginResult>("/api/auth/login", { method: "POST", body: input }),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => fetchJson<void>("/api/auth/logout", { method: "POST" }),
  });
}
