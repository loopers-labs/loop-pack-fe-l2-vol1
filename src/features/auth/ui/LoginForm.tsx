"use client";
import { useState } from "react";
import { HttpError } from "@/shared/api";
import { useLogin } from "../model/useLogin";

// 실패 문구는 화면이 소유한다. 서버 message를 그대로 쓰되, 서버가 말이 없을 때의
// 기본값은 여기서 정한다.
function describeFailure(error: unknown): string {
  if (error instanceof HttpError && error.status === 401) {
    return error.message;
  }
  return "로그인을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function LoginForm({ nextPath }: { nextPath: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin(nextPath);

  return (
    <form
      className="shop-form"
      onSubmit={(event) => {
        event.preventDefault();
        login.mutate({ email, password });
      }}
    >
      <label className="shop-field">
        이메일
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="shop-field">
        비밀번호
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {/* 4xx는 화면 안에서 처리한다(자격 증명을 고쳐 빠져나갈 수 있는 실패다).
          5xx는 postJson이 던지고 mutation이 여기 error로 담는다 — 경계로 보내면
          입력한 값이 사라져 다시 치게 된다. */}
      {login.isError && (
        <p className="shop-state" role="alert">
          {describeFailure(login.error)}
        </p>
      )}

      <button type="submit" disabled={login.isPending}>
        {login.isPending ? "로그인하는 중…" : "로그인"}
      </button>
    </form>
  );
}
