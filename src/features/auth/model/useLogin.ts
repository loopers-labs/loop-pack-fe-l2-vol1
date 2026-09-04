"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  SESSION_QUERY_KEY,
  type LoginRequest,
  type SessionResponse,
  type SessionState,
} from "@/entities/session";
import { postJson } from "@/shared/api";
import { DEFAULT_NEXT_PATH, safeNextPath } from "@/shared/lib/safeNextPath";

export function useLogin(nextPath: string | null) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    // 로그인은 사용자 액션의 부수효과다 — effect가 아니라 이벤트 핸들러에서 부른다.
    mutationFn: (credentials: LoginRequest) =>
      postJson<SessionResponse>("/api/auth/login", credentials),
    onSuccess: (data) => {
      if (data === null) {
        return;
      }
      const session: SessionState = { status: "authenticated", user: data.user };
      // 응답이 이미 사용자를 주므로 다시 묻지 않는다.
      queryClient.setQueryData(SESSION_QUERY_KEY, session);

      // 복원 경로는 여기서 한 번 더 검증한다. proxy가 만들어 넣은 값이라도
      // 사용자가 주소창에서 갈아끼울 수 있으므로, 쓰는 쪽에서 다시 본다.
      const destination = safeNextPath(nextPath);
      router.replace(destination === "" ? DEFAULT_NEXT_PATH : destination);
      // 보호 경로는 서버에서 세션을 다시 읽어야 한다 — 안 하면 방금 로그인했는데
      // 캐시된 로그아웃 HTML이 그려진다.
      router.refresh();
    },
  });
}
