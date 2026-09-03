"use client";

import { useMutation } from "@tanstack/react-query";
import { login, useSessionActions } from "@/entities/session";

export function useLogin() {
  const { setUser } = useSessionActions();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      setUser(user);
    },
  });
}
