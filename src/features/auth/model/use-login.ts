"use client";

import { useMutation } from "@tanstack/react-query";
import { login, useSessionActions } from "@/entities/session";
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
  const { setUser } = useSessionActions();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      setUser(user);
      identifyUser(user.id);
      trackEvent("login_success", { from });
    },
    onError: (error) => {
      trackEvent("login_fail", { from, reason: failReason(error) });
    },
  });
}
