"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { CommerceApiError } from "@/shared/api/commerce-client";
import { useLogin } from "../model/use-login";

type LoginFormProps = {
  // 이미 sanitizeReturnTo 를 거친 같은 사이트 경로
  returnTo: string;
};

export function LoginForm({ returnTo }: LoginFormProps) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, isPending, error } = useLogin();

  const errorMessage =
    error === null
      ? null
      : error instanceof CommerceApiError
        ? error.message
        : "잠시 후 다시 시도해 주세요.";

  return (
    <form
      className="week09-form"
      aria-label="로그인"
      onSubmit={(event) => {
        event.preventDefault();
        mutate(
          { email, password },
          {
            onSuccess: () => {
              // 로그아웃 상태에서 캐시된 서버 렌더(보호 경로의 로그인 리다이렉트 포함)를 버리고 이동한다
              router.refresh();
              router.replace(returnTo);
            },
          },
        );
      }}
    >
      <label htmlFor={emailId}>이메일</label>
      <input
        id={emailId}
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label htmlFor={passwordId}>비밀번호</label>
      <input
        id={passwordId}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {errorMessage === null ? null : <p role="alert">{errorMessage}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
