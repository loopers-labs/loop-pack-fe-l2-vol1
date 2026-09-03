'use client';

// [AI] 로그인 폼 (week-09 1-1~1-3): UI + 연동 + 실패 분기 + 제출 중 상태 + 복원 이동.
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/widgets/header/Header';
import { identify, track } from '@/analytics/logger';
import { loginRequest } from '@/entities/auth/api';
import { getLoginErrorMessage } from '../model/getLoginErrorMessage';
import { getLoginFailReason } from '../model/getLoginFailReason';
import { getSafeRedirectPath } from '@/shared/lib/getSafeRedirectPath';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
  // [AI] 에러 메시지 자리(role=alert). 서버 실패 응답(400/401) 메시지가 채워진다.
  const [error, setError] = useState<string | null>(null);
  // [AI] 제출 처리 중 플래그. 버튼 disabled + 핸들러 가드의 이중 안전장치로 쓴다.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  // [AI] proxy가 실어 보낸 원래 경로 (예: /login?redirectTo=%2Forders).
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirectTo');
  // [AI] 만료 처리기가 실어 보낸 신호 — 이번 로그인은 "만료 후 재로그인"임을 화면에 안내한다.
  const isExpiredSession = searchParams.get('expired') === '1';

  useEffect(() => {
    track('login_start');
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    // [AI] 기본 제출(GET + 페이지 리로드, 비밀번호가 URL에 노출)을 막고 JS로 처리한다.
    event.preventDefault();
    // [AI] 응답 대기 중(500ms~1.5s)에 버튼을 다시 누르면 요청이 중복된다.
    // disabled가 UI를 막고, 이 가드가 엔터키 등 disabled를 우회하는 경로를 막는다.
    if (isSubmitting) return;
    setIsSubmitting(true);

    // [AI] currentTarget은 await 뒤에 접근하면 null이 되므로 동기적으로 먼저 읽는다.
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      // [AI] 재제출 시 이전 실패 문구가 남아있지 않게 먼저 지운다.
      setError(null);
      // 성공(200): 브라우저가 Set-Cookie로 세션 쿠키를 저장한다 (클라이언트가 직접 다루지 않는다).
      const session = await loginRequest({ email, password });
      // [AI] identify를 먼저 연결한 뒤 성공 이벤트를 보낸다 — "이 시점부터 이 사용자"의 순서.
      identify(session.user.id);
      track('login_success');
      // [AI] 복원: redirectTo 검증은 이동 직전(사용하는 곳)에서 수행한다 (RFC 검증 위치 규칙).
      // 외부 주소(https://, //evil.com)는 기본 경로('/')로 조용히 되돌려진다.
      router.push(getSafeRedirectPath(redirectParam));
    } catch (err) {
      // 실패: 상태 코드에 맞는 안내 문구로 분기한다 (401 자격 증명 / 400 형식 / 그 외 재시도).
      // auth 엔드포인트의 401은 세션 만료가 아니라 자격 증명 실패다 (RFC 401 구분 규칙).
      setError(getLoginErrorMessage(err));
      // [AI] 실패 원인은 시드 로그 스키마(reason)와 같은 코드로 남긴다 — 나중에 집계해 비교 가능.
      track('login_fail', { reason: getLoginFailReason(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <Header />
      <section className="section">
        <h1>로그인</h1>
        {/* [AI] 만료 안내 (1-4): 세션 만료로 이곳에 온 사용자에게 다음 행동을 알려준다. */}
        {isExpiredSession && (
          <p className={styles.notice} role="status">
            세션이 만료되었어요. 다시 로그인해 주세요.
          </p>
        )}
        <form className={styles.loginForm} onSubmit={handleLogin}>
          <div className={styles.field}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
          {/* [AI] 에러 메시지 자리. role=alert라 표시되는 순간 스크린리더에도 알린다. */}
          {error !== null && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
};
