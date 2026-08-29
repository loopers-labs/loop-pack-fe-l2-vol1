"use client";

import { useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../api/authMutations";
import {
  sessionQueries,
  useSession,
  type SessionResponse,
} from "@/entities/session";
import { HttpError } from "@/shared/api";
import { safeRedirect, REDIRECT_PARAM } from "@/shared/lib";
import styles from "./LoginForm.module.css";

const CREDENTIALS_ERROR = "이메일 또는 비밀번호를 확인해주세요.";
const GENERIC_ERROR = "잠시 후 다시 시도해주세요.";

// 잘못된 자격증명(400/401)만 사용자 입력 문제로 안내하고, 그 외(5xx·네트워크)는 일시 오류로 뭉뚱그린다.
function getLoginErrorMessage(error: unknown): string {
  const isCredentialError =
    error instanceof HttpError &&
    (error.status === 400 || error.status === 401);

  return isCredentialError ? CREDENTIALS_ERROR : GENERIC_ERROR;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      // 로그인 응답의 user 로 세션 캐시를 채운다 → useSession 이 인증됨으로 바뀌고 아래 이동 effect 가 뒤를 잇는다.
      queryClient.setQueryData<SessionResponse>(
        sessionQueries.me().queryKey,
        session,
      );
    },
  });

  // 이미 로그인했거나(로그인 페이지 직접 진입) 방금 로그인에 성공하면 원래 경로로 보낸다.
  // 차단을 서버 proxy 가 아니라 여기(앱 세션=/api/auth/me)에서 판단해야, 만료(쿠키는 유효한데 API 401)
  // 때 로그인 화면이 proxy 역가드에 되돌려차이지 않는다. redirectUrl 의 외부·트릭 경로는 safeRedirect 가 접는다.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(safeRedirect(searchParams.get(REDIRECT_PARAM)));
    }
  }, [isAuthenticated, router, searchParams]);

  // 에러 문구는 mutation.error 에서 파생한다(별도 state 로 동기화하지 않는다).
  const errorMessage = mutation.isError
    ? getLoginErrorMessage(mutation.error)
    : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    mutation.mutate({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>이메일</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className={styles.field}>
        <span>비밀번호</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {errorMessage !== null && (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        className={styles.submit}
        disabled={mutation.isPending}
      >
        로그인
      </button>
    </form>
  );
}
