"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import type { SubmitEvent } from "react";
import { login, sessionQueries } from "@/entities/session";
import { normalizeLoginRedirectPath } from "../model/redirect";

export function LoginPage() {
  const emailId = useId();
  const passwordId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectTo = normalizeLoginRedirectPath(searchParams.get("redirectTo"));

  const loginMutation = useMutation({
    mutationFn: login,
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(sessionQueries.me().queryKey, session);
      router.push(redirectTo);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    loginMutation.mutate({
      email,
      password,
    });
  };

  return (
    <main className="min-h-screen bg-gds-gray-100 px-4 py-12 text-gds-gray-900 sm:px-6">
      <div className="mx-auto grid w-full max-w-[460px] gap-6">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-gds-green-700">Commerce</p>
          <h1 className="text-3xl font-bold tracking-tight">로그인</h1>
          <p className="text-sm leading-6 text-gds-gray-700">
            주문과 주문 내역 확인을 위해 로그인해주세요.
          </p>
        </div>

        <form
          className="grid gap-5 rounded-gds-lg bg-white p-6 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-gds-gray-900" htmlFor={emailId}>
              이메일
            </label>
            <input
              id={emailId}
              className="min-h-11 rounded-gds-sm border border-gds-gray-300 bg-white px-3 py-2.5 text-sm text-gds-gray-900 placeholder:text-gds-gray-500 focus:border-gds-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-gds-gray-900" htmlFor={passwordId}>
              비밀번호
            </label>
            <input
              id={passwordId}
              className="min-h-11 rounded-gds-sm border border-gds-gray-300 bg-white px-3 py-2.5 text-sm text-gds-gray-900 placeholder:text-gds-gray-500 focus:border-gds-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {errorMessage !== null ? (
            <p className="rounded-gds-sm bg-gds-gray-50 px-3 py-2 text-sm font-semibold text-gds-red-500 shadow-[inset_0_0_0_1px_var(--color-gds-red-500)]">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="min-h-11 cursor-pointer rounded-gds-sm border border-gds-green-500 bg-gds-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gds-green-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
            type="submit"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "로그인 중입니다." : "로그인"}
          </button>
        </form>
      </div>
    </main>
  );
}
