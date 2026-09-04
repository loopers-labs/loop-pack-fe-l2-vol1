'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authQueries } from '@/entities/auth';
import { ApiError } from '@/shared/api/apiFetch';
import { identify } from '@/analytics/logger';
import { trackLoginFail, trackLoginStart, trackLoginSuccess, type LoginFailReason } from '@/analytics/events';
import { resolveLoginDestination } from '../lib/resolveLoginDestination';
import { login } from '../api/login';

// 05-step2-design.md 질문 4 — 시드는 INVALID_CREDENTIALS 하나뿐이지만 400·5xx·네트워크
// 실패를 뭉치면 3단계에서 "무엇을 실패로 셌는지"를 밝힐 수 없어 원인별로 나눈다.
function resolveLoginFailReason(error: unknown): LoginFailReason {
  if (!(error instanceof ApiError)) return 'NETWORK_ERROR';
  if (error.status === 401) return 'INVALID_CREDENTIALS';
  if (error.status === 400) return 'BAD_REQUEST';
  if (error.status >= 500) return 'SERVER_ERROR';
  return 'NETWORK_ERROR';
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useMutation({ mutationFn: login });

  // login_start.from — 시드는 화면 이름을 담지만 내 앱은 next 파라미터의 경로만 안다.
  // proxy.ts가 next를 절대 URL로 만들므로(01번 5번 결정) pathname만 잘라 넣는다 — origin이
  // 로컬·운영에서 달라 그대로 넣으면 같은 화면이 두 값으로 집계된다.
  // 'use client' 컴포넌트도 초기 HTML은 서버에서 그려지므로 window를 여기서 읽지 않는다 —
  // 더미 base는 URL 파싱용일 뿐 실제로 쓰이지 않는다(next가 절대 URL이면 무시된다).
  const nextParam = searchParams.get('next');
  const from = nextParam !== null && nextParam !== '' ? new URL(nextParam, 'http://localhost').pathname : null;

  useEffect(() => {
    trackLoginStart(from);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시점의 from 하나만 본다. 재실행은 불필요하다.
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const session = await loginMutation.mutateAsync({ email, password });
      trackLoginSuccess({ from, userId: session.user.id });
      identify(session.user.id);
      void queryClient.invalidateQueries({ queryKey: authQueries.all() });
      //  로그인 화면은 스토리에 남지 않는다
      router.replace(resolveLoginDestination(nextParam, window.location.origin));
    } catch (error) {
      trackLoginFail(resolveLoginFailReason(error));
      // loginMutation.error에 담긴 값으로 아래에서 렌더링한다.
    }
  }

  const errorMessage = loginMutation.error instanceof ApiError ? loginMutation.error.message : loginMutation.isError ? '로그인하지 못했습니다.' : '';

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label>
        이메일
        <input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        비밀번호
        <input name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {errorMessage !== '' && <p role="alert">{errorMessage}</p>}
      <button type="submit" disabled={loginMutation.isPending}>
        로그인
      </button>
    </form>
  );
}
