"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { trackEvent } from "@/analytics/schema";
import { useLogin } from "@/features/auth/api/mutations";
import { safeRedirect } from "@/shared/lib/safeRedirect";
import buttonStyles from "@/shared/ui/button.module.css";
import { LoadingDots } from "@/shared/ui/loading-dots/LoadingDots";

import styles from "./LoginForm.module.css";

type LoginFormProps = {
  // proxy가 실어 보낸 원래 경로. 소비 시점에 safeRedirect로 다시 검증한다.
  redirect: string | null;
};

export function LoginForm({ redirect }: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 로그인 화면 진입을 1회 기록한다. from은 어디서 왔는지 — 보호 경로 리다이렉트면 그 경로, 아니면 direct.
  useEffect(() => {
    trackEvent("login_start", { from: redirect ?? "direct" });
  }, [redirect]);

  // 성공 후에도 화면 전환(soft navigation)이 끝날 때까지 로딩을 유지한다.
  // isPending만 쓰면 성공 직후 전환 전에 버튼이 잠깐 "로그인"으로 되돌아가 번쩍인다.
  const isLoading = login.isPending || login.isSuccess;

  const submit = () => {
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          trackEvent("login_success", { from: redirect ?? "direct" });
          // 서버 파생 상태(헤더 로그인 등)를 갱신하고 원래 경로로 돌린다.
          // redirect는 신뢰할 수 없으므로 여기서 다시 검증한다(오픈 리다이렉트 방어).
          router.replace(safeRedirect(redirect));
          router.refresh();
        },
        onError: (error) => {
          trackEvent("login_fail", { reason: error.message });
        },
      },
    );
  };

  return (
    // onSubmit을 인라인해 event 타입을 추론시킨다(React 19에서 FormEvent는 deprecated).
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {/* 라벨 텍스트 대신 placeholder로 보이되, aria-label로 접근성 이름을 남긴다(입력 중에도 유지). */}
      <input
        className={styles.input}
        type="email"
        aria-label="이메일"
        placeholder="이메일"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      <input
        className={styles.input}
        type="password"
        aria-label="비밀번호"
        placeholder="비밀번호"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
      />
      {login.isError && (
        <p role="alert" className={styles.error}>
          {login.error?.message}
        </p>
      )}
      <button
        type="submit"
        className={buttonStyles.primary}
        disabled={isLoading}
        aria-label={isLoading ? "로그인 중" : undefined}
      >
        {isLoading ? <LoadingDots /> : "로그인"}
      </button>
    </form>
  );
}
