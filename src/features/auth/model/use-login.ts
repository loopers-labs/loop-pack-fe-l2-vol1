"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, SESSION_QUERY_KEY, useSessionActions } from "@/entities/session";
import { identifyUser, trackEvent, type LoginFrom } from "@/shared/analytics";
import { CommerceApiError } from "@/shared/api/commerce-client";

type UseLoginOptions = {
  from: LoginFrom;
};

const failReason = (error: unknown) => {
  if (!(error instanceof CommerceApiError)) {
    return "NETWORK";
  }
  return error.status === 401 ? "INVALID_CREDENTIALS" : "SERVER_ERROR";
};

export function useLogin({ from }: UseLoginOptions) {
  const queryClient = useQueryClient();
  const { setUser } = useSessionActions();

  return useMutation({
    mutationFn: login,
    onSuccess: async (user) => {
      // 로그인 화면이 마운트될 때 시작된 미인증 세션 재확인(/api/auth/me → 401)이 아직 진행 중일 수 있다.
      // 그대로 두면 로그인 성공으로 세션을 채운 직후 도착한 401 을 SessionBoundary 가 만료로 읽는다.
      // 로그인 성공은 그 재확인을 무효로 만드므로 먼저 취소한다
      await queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
      setUser(user);
      identifyUser(user.id);
      trackEvent("login_success", { from });
    },
    onError: (error) => {
      trackEvent("login_fail", { from, reason: failReason(error) });
    },
  });
}
