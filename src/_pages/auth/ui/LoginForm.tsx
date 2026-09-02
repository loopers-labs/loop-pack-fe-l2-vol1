'use client';

// [AI] 로그인 폼 (week-09 1-1): UI 뼈대 + POST /api/auth/login 연동.
// 400/401 분기 메시지와 제출 중 상태·중복 제출 방지는 체크리스트 다음 항목에서 추가한다.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/widgets/header/Header';
import { loginRequest } from '@/entities/auth/api';
import { ApiError } from '@/shared/api/fetcher';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
  // [AI] 에러 메시지 자리(role=alert). 서버 실패 응답(400/401) 메시지가 채워진다.
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    // [AI] 기본 제출(GET + 페이지 리로드, 비밀번호가 URL에 노출)을 막고 JS로 처리한다.
    event.preventDefault();

    // [AI] currentTarget은 await 뒤에 접근하면 null이 되므로 동기적으로 먼저 읽는다.
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      // 성공(200): 브라우저가 Set-Cookie로 세션 쿠키를 저장한다 (클라이언트가 직접 다루지 않는다).
      await loginRequest({ email, password });
      // [AI] 복원 이동(redirectTo 읽기)은 1-3에서 getSafeRedirectPath로 교체한다. 지금은 홈으로.
      router.push('/');
    } catch (err) {
      // 실패: 서버가 내린 메시지(400/401)를 폼에 표시한다.
      // auth 엔드포인트의 401은 자격 증명 실패이지 세션 만료가 아니다 (RFC 401 구분 규칙).
      setError(
        err instanceof ApiError ? err.message : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      );
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
          <button type="submit" className={styles.submit}>
            로그인
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
