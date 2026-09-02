'use client';

// [AI] 로그인 폼 (week-09 1-1 첫 항목: UI 뼈대).
// 이메일·비밀번호 입력, 제출 버튼, 에러 메시지 자리(role=alert)를 먼저 잡는다.
// API 연동, 400/401 분기 메시지, 제출 중 상태·중복 제출 방지는 체크리스트 다음 항목에서 추가한다.
import { Header } from '@/widgets/header/Header';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
  // [AI] 에러 메시지 자리. UI 단계에서는 고정값(null)이며,
  // 다음 항목(400/401 분기)에서 useState + 서버 응답 기반으로 대체된다.
  const error: string | null = null;

  return (
    <main className="page">
      <Header />
      <section className="section">
        <h1>로그인</h1>
        <form
          className={styles.loginForm}
          // [AI] UI 단계 임시 방어: 폼 기본 제출(페이지 새로고침 GET)을 막는다.
          // 실제 제출 처리는 다음 항목(POST /api/auth/login 연동)에서 교체한다.
          onSubmit={(event) => event.preventDefault()}
        >
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
