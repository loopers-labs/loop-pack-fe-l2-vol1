'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { AuthApiError, login } from '@/entities/auth/api/authService';
import { replaceDocumentLocation } from '@/shared/lib/browserNavigation';
import {
  getLoginFailureReason,
  identifyAnalyticsUser,
  trackLoginFail,
  trackLoginStart,
  trackLoginSuccess,
} from '@/analytics/events';
import { useAnalyticsPageView } from '@/analytics/useAnalyticsPageView';
import type { LoginFrom } from '@/shared/lib/loginFrom';

interface LoginContentProps {
  returnTo: string;
  loginFrom: LoginFrom;
}

export function LoginContent({ returnTo, loginFrom }: LoginContentProps) {
  const errorRef = useRef<HTMLParagraphElement>(null);
  useAnalyticsPageView(() => trackLoginStart(loginFrom));

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: ({ user }) => {
      identifyAnalyticsUser(user.id);
      trackLoginSuccess(loginFrom);
      replaceDocumentLocation(returnTo);
    },
    onError: (error) => {
      const status = error instanceof AuthApiError ? error.status : undefined;
      trackLoginFail(loginFrom, getLoginFailureReason(status));
    },
  });

  const errorMessage = loginMutation.error
    ? loginMutation.error instanceof AuthApiError
      ? loginMutation.error.message
      : '로그인에 실패했습니다.'
    : null;

  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.focus();
    }
  }, [errorMessage]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    loginMutation.mutate({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-2xl border border-border bg-bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-text">
          로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          주문을 계속하려면 계정으로 로그인해 주세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-text">이메일</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              autoFocus
              defaultValue="looper1@loopers.dev"
              disabled={loginMutation.isPending}
              className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 text-base text-text outline-none transition-colors focus:border-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text disabled:cursor-wait disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-text">비밀번호</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              defaultValue="looper1234"
              disabled={loginMutation.isPending}
              className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 text-base text-text outline-none transition-colors focus:border-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text disabled:cursor-wait disabled:opacity-60"
            />
          </label>

          {errorMessage && (
            <p
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="rounded-lg border border-discount/30 bg-neutral-50 px-4 py-3 text-sm leading-6 text-text focus:outline-none"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="flex min-h-[52px] w-full items-center justify-center rounded-lg bg-text px-5 text-[15px] font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text disabled:cursor-wait disabled:opacity-50"
          >
            {loginMutation.isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-text-caption">
          테스트 계정은 looper1@loopers.dev부터 looper8@loopers.dev까지이며,
          비밀번호는 모두 looper1234입니다.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-text-secondary underline underline-offset-4 transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          상품 목록으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
