"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AUTH_MUTATION_KEY,
  SESSION_QUERY_KEY,
  type LoginRequest,
  type SessionResponse,
  type SessionState,
} from "@/entities/session";
import { EVENT, identifyUser, trackEvent } from "@/shared/analytics";
import { HttpError, postJson } from "@/shared/api";
import { DEFAULT_NEXT_PATH, safeNextPath } from "@/shared/lib/safeNextPath";

export function useLogin(nextPath: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    // 세션 판정에서 빼는 표식. 로그인 실패의 401은 "자격 증명이 틀렸다"는
    // 뜻이지 "세션이 만료됐다"가 아니다(entities/session/model/sessionExpiry.ts).
    mutationKey: [...AUTH_MUTATION_KEY, "login"],
    // 로그인은 사용자 액션의 부수효과다 — effect가 아니라 이벤트 핸들러에서 부른다.
    mutationFn: (credentials: LoginRequest) =>
      postJson<SessionResponse>("/api/auth/login", credentials),
    onError: (error) => {
      // 실패 이유를 코드로 남긴다. 서버 문구를 그대로 담으면 문구가 바뀔 때
      // 집계가 갈라지고, 사용자가 입력한 값이 로그에 섞일 위험도 있다.
      const reason =
        error instanceof HttpError && error.status === 401 ? "invalid_credentials" : "server_error";
      trackEvent(EVENT.loginFail, { reason });
    },
    onSuccess: (data) => {
      if (data === null) {
        return;
      }
      // identify는 로그인 성공 시점에 부른다. 그 뒤 이벤트에 userId가 붙는다 —
      // 시드 로그에서도 userId가 로그인 이후 이벤트에만 있다.
      identifyUser(data.user.id);
      // from은 로그인을 시작한 자리다. 복원 경로가 곧 "어디서 막혀 왔는가"다.
      trackEvent(EVENT.loginSuccess, { from: safeNextPath(nextPath) });

      const session: SessionState = { status: "authenticated", user: data.user };
      // 날아가 있던 세션 조회가 늦게 끝나 방금 만든 상태를 덮지 않게 끊는다.
      void queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
      // 응답이 이미 사용자를 주므로 다시 묻지 않는다.
      queryClient.setQueryData(SESSION_QUERY_KEY, session);

      // 복원 경로는 여기서 한 번 더 검증한다. proxy가 만들어 넣은 값이라도
      // 사용자가 주소창에서 갈아끼울 수 있으므로, 쓰는 쪽에서 다시 본다.
      const destination = safeNextPath(nextPath);
      const target = destination === "" ? DEFAULT_NEXT_PATH : destination;

      // ── 왜 router.replace가 아니라 문서 이동인가 ─────────────────────────
      // 로그인 직전에 이 브라우저는 보호 경로를 한 번 이상 요청해 307을 받았고,
      // 그 결과("/checkout → /login")가 Next 클라이언트 라우터 캐시에 남는다.
      // 쿠키가 생긴 뒤에 router.replace(target)를 부르면 캐시가 먼저 답해서
      // 다시 /login으로 돌아온다(실측: POST 200 뒤 /login RSC만 두 번 더 나가고
      // 주소는 /login에 머물렀다).
      //
      // 그 캐시를 경로 단위로 비우는 API가 없다. router.refresh()는 현재 경로만
      // 무효화하고, 순서도 보장되지 않는다. 인증 경계를 넘는 이동은 문서 이동이
      // 정확하고, 부수 효과로 (shop) layout이 서버에서 다시 돌아 초기 HTML에
      // 새 로그인 상태가 실린다.
      window.location.assign(target);
    },
  });
}
