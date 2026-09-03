"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/entities/session";
import { clearClientSession } from "./clear-client-session";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => clearClientSession(queryClient),
  });
}
