import { Suspense } from 'react';
import LoginForm from './LoginForm';
import LoginNotice from './LoginNotice';

export default function LoginPage() {
  return (
    <main className="page-container login-page">
      <h1>로그인</h1>
      {/* useSearchParams는 Suspense 경계 안에서만 정적 렌더를 통과한다 */}
      <Suspense>
        <LoginNotice />
        <LoginForm />
      </Suspense>
    </main>
  );
}
