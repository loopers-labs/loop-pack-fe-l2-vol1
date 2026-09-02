// [AI] 얇은 라우팅 진입점. 비즈니스는 _pages/auth에 위임.
// 이 경로는 1-3의 proxy.ts가 미로그인 가드 시 리다이렉트 목적지로 쓴다 (RFC 1-0 결정).
import type { Metadata } from 'next';
import { LoginForm } from '@/_pages/auth/ui/LoginForm';

export const metadata: Metadata = {
  title: '로그인',
  // 로그인 페이지는 검색 엔진 유입 대상이 아니므로 색인에서 제외한다.
  robots: { index: false },
};

const LoginPage = () => <LoginForm />;

export default LoginPage;
