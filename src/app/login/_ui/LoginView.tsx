'use client';

import { Header } from '@/widgets/header/ui/Header';
import { PageHeading } from '@/shared/ui/PageHeading/PageHeading';
import { LoginForm } from '@/features/auth-login/ui/LoginForm';
import { useScreenViewOnce } from '@/analytics/useScreenViewOnce';
import { trackLoginStart } from '@/analytics/trackEvents';

type LoginViewProps = {
  /** 로그인 후 이동할 내부 경로. 페이지에서 이미 검증해 넘긴다 */
  redirectPath: string;
  /** 세션이 만료되어 되돌려진 진입인지. 안내 문구가 달라진다 */
  expired: boolean;
};

export function LoginView({ redirectPath, expired }: LoginViewProps) {
  useScreenViewOnce(() => trackLoginStart(redirectPath));

  return (
    <div className="week05-page">
      <Header />
      <main>
        <PageHeading
          title="로그인"
          description="주문서와 주문 내역은 로그인한 뒤에 이용할 수 있습니다."
          compact
        />
        {expired ? <p role="status">세션이 만료되었습니다. 다시 로그인해 주세요.</p> : null}
        <section className="week05-section">
          <LoginForm redirectPath={redirectPath} />
        </section>
      </main>
    </div>
  );
}
