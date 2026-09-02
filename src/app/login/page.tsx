// [AI] 얇은 라우팅 진입점. 비즈니스는 _pages/auth에 위임.
// useSearchParams(redirectTo 복원)는 정적 렌더에서 Suspense 경계가 필요하므로 감싼다
// (products/page.tsx의 nuqs Suspense와 같은 사유).
// 이 경로는 1-3의 proxy.ts가 리다이렉트 목적지로 쓰고, 로그인 상태 접근 시 홈으로 되돌린다.
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/_pages/auth/ui/LoginForm';

export const metadata: Metadata = {
  title: '로그인',
  // 로그인 페이지는 검색 엔진 유입 대상이 아니므로 색인에서 제외한다.
  robots: { index: false },
};

const LoginPage = () => (
  <Suspense fallback={null}>
    <LoginForm />
  </Suspense>
);

export default LoginPage;
