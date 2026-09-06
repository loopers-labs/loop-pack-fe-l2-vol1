import Link from "next/link";
import type { ReactNode } from "react";
import { HeaderActions } from "./header-actions";

type SiteHeaderProps = {
  // 로그인 상태 영역. 세션을 읽는 라우트 그룹만 채우고, 정적 화면 그룹은 비워 둔다
  auth?: ReactNode;
};

export function SiteHeader({ auth }: SiteHeaderProps) {
  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <HeaderActions />
        {auth}
      </nav>
    </header>
  );
}
