'use client';

// [AI] 로그인 폼 (week-09 1-1): UI 뼈대 + POST /api/auth/login 연동.
// 400/401 분기 메시지와 제출 중 상태·중복 제출 방지는 체크리스트 다음 항목에서 추가한다.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/widgets/header/Header';
import { loginRequest } from '@/entities/auth/api';
import { getLoginErrorMessage } from '../model/getLoginErrorMessage';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
  // [AI] 에러 메시지 자리(role=alert). 서버 실패 응답(400/401) 메시지가 채워진다.
  const [error, setError] = useState<string | null>(null);
  // [AI] 제출 처리 중 플래그. 버튼 disabled + 핸들러 가드의 이중 안전장치로 쓴다.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
      await loginRequest({ email, password });
      // [AI] 복원 이동(redirectTo 읽기)은 1-3에서 getSafeRedirectPath로 교체한다. 지금은 홈으로.
      router.push('/');
    } catch (err) {
      // 실패: 상태 코드에 맞는 안내 문구로 분기한다 (401 자격 증명 / 400 형식 / 그 외 재시도).
      // auth 엔드포인트의 401은 세션 만료가 아니라 자격 증명 실패다 (RFC 401 구분 규칙).
      setError(getLoginErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <Header />
      <section className="section">
        <h1>로그인</h1>
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
