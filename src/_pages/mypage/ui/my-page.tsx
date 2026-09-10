import Link from "next/link";
import { LogoutButton } from "@/features/auth";
import type { AuthUser } from "@/types/auth";

type MyPageProps = {
  user: AuthUser;
};

export function MyPage({ user }: MyPageProps) {
  return (
    <section className="week05-section week09-narrow" aria-labelledby="mypage-title">
      <h1 id="mypage-title">마이페이지</h1>
      <dl className="week09-profile">
        <dt>이름</dt>
        <dd>{user.name}</dd>
        <dt>이메일</dt>
        <dd>{user.email}</dd>
      </dl>
      <nav aria-label="마이페이지 메뉴" className="week09-actions">
        <Link href="/orders">주문 내역 보기</Link>
        <Link href="/checkout">주문서로 이동</Link>
        <LogoutButton />
      </nav>
    </section>
  );
}
